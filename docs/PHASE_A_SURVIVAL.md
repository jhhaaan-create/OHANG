# OHANG Phase A: Pre-Launch Survival Shield

> **Version:** 1.0.0
> **Target:** Claude Code terminal agent
> **Constraint:** Zero modifications to SajuEngine, prompt modules, or Sprint 1 UI components.
> **Validation:** `npm run build` must pass with zero errors after all patches.

---

## Mission 1: Atomic Webhook Idempotency

### Problem
Stripe may retry webhook deliveries if it doesn't receive 200 within ~5 seconds. The current `src/app/api/stripe/webhook/route.ts` has no duplicate guard — a retried `checkout.session.completed` event will attempt to double-upsert tiers and double-insert IAP records.

### Step 1.1 — Create `stripe_events` migration

**Create file:** `supabase/migrations/20260226_stripe_idempotency.sql`

```sql
-- Idempotency guard for Stripe webhook events.
-- INSERT with ON CONFLICT DO NOTHING = atomic dedup in 1 round-trip.
CREATE TABLE IF NOT EXISTS stripe_events (
    id          TEXT PRIMARY KEY,           -- Stripe event ID (evt_xxx)
    event_type  TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only service_role writes
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_events_full"
    ON stripe_events FOR ALL
    TO service_role USING (true) WITH CHECK (true);

-- TTL cleanup: remove events older than 7 days (pg_cron)
-- SELECT cron.schedule('stripe_event_cleanup', '0 3 * * *',
--     $$DELETE FROM stripe_events WHERE processed_at < NOW() - INTERVAL '7 days'$$
-- );
```

### Step 1.2 — Rewrite webhook with idempotency guard

**File:** `src/app/api/stripe/webhook/route.ts`

**Replace the ENTIRE file** with the following:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// ═══════════════════════════════════════════════════════
// OHANG — Stripe Webhook Handler v3.0 (Idempotent)
//
// Idempotency: INSERT event ID with ON CONFLICT DO NOTHING.
//   - 0 rows affected = duplicate → return 200 immediately.
//   - If business logic fails, DELETE event ID → Stripe retries.
//
// Events:
//   checkout.session.completed    → Upgrade user tier
//   customer.subscription.updated → Tier change
//   customer.subscription.deleted → Downgrade to free
//   invoice.payment_failed        → Log warning
// ═══════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

// ── Idempotency Guard ──────────────────────────────────
// Returns true if this event is NEW (should be processed).
// Returns false if this event was already processed (skip).
async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    // Atomic INSERT + ON CONFLICT DO NOTHING
    // If event ID already exists, the insert silently does nothing.
    const { data, error } = await supabase
        .from('stripe_events')
        .insert({ id: eventId, event_type: eventType })
        .select('id')
        .single();

    // PostgreSQL 23505 = unique_violation → already processed
    if (error) {
        if (error.code === '23505') return false;
        // For Supabase PostgREST: conflict returns null data, no error
        // If it's a genuine error, log and still return false (fail-safe)
        console.error('[Webhook] claimEvent error:', error);
        return false;
    }

    return !!data;
}

// Rollback: allow retry if business logic fails
async function releaseEvent(eventId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from('stripe_events').delete().eq('id', eventId);
}

// ── Tier Resolution ────────────────────────────────────
function resolveTierFromMetadata(metadata: Record<string, string> | null): string {
    if (!metadata) return 'basic';
    return metadata.tier || metadata.plan || 'basic';
}

// ── User Tier Upsert ───────────────────────────────────
async function updateUserTier(
    userId: string,
    tier: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
) {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('user_subscriptions')
        .upsert(
            {
                user_id: userId,
                subscription_tier: tier,
                stripe_customer_id: stripeCustomerId || null,
                stripe_subscription_id: stripeSubscriptionId || null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error(`[Webhook] Failed to update tier for ${userId}:`, error);
        throw error;
    }

    console.log(`[Webhook] User ${userId} → tier: ${tier}`);
}

// ── Main Handler ───────────────────────────────────────
export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = constructWebhookEvent(body, signature);
    } catch (err) {
        console.error("[Webhook] Signature verification failed:", err);
        return NextResponse.json(
            { error: "Webhook verification failed" },
            { status: 400 }
        );
    }

    // ── Idempotency check ──
    const isNew = await claimEvent(event.id, event.type);
    if (!isNew) {
        console.log(`[Webhook] Duplicate event skipped: ${event.id}`);
        return NextResponse.json({ received: true, duplicate: true });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (!userId) {
                    console.error("[Webhook] No userId in checkout metadata");
                    break;
                }

                const tier = resolveTierFromMetadata(session.metadata as Record<string, string>);
                const customerId = typeof session.customer === 'string'
                    ? session.customer
                    : session.customer?.id;
                const subscriptionId = typeof session.subscription === 'string'
                    ? session.subscription
                    : session.subscription?.id;

                await updateUserTier(userId, tier, customerId, subscriptionId);

                if (session.mode === 'payment') {
                    const plan = session.metadata?.plan;
                    if (plan && ['red_flag', 'couple_scan', 'retro_mode'].includes(plan)) {
                        const supabase = getSupabaseAdmin();
                        await supabase
                            .from('user_iap_purchases')
                            .insert({
                                user_id: userId,
                                feature: plan,
                                stripe_payment_id: session.payment_intent as string,
                                purchased_at: new Date().toISOString(),
                            });
                        console.log(`[Webhook] IAP granted: ${userId} → ${plan}`);
                    }
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;
                if (!userId) break;

                const priceId = subscription.items.data[0]?.price.id;
                let newTier = 'pro';
                if (priceId === process.env.STRIPE_PRICE_DESTINY_LIFETIME) {
                    newTier = 'destiny';
                }

                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer.id;

                await updateUserTier(userId, newTier, customerId, subscription.id);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                if (!userId) {
                    const supabase = getSupabaseAdmin();
                    const { data } = await supabase
                        .from('user_subscriptions')
                        .select('user_id')
                        .eq('stripe_subscription_id', subscription.id)
                        .single();

                    if (data?.user_id) {
                        await updateUserTier(data.user_id, 'free');
                    }
                    break;
                }

                await updateUserTier(userId, 'free');
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = typeof invoice.customer === 'string'
                    ? invoice.customer
                    : invoice.customer?.id;
                console.warn(`[Webhook] Payment failed for customer: ${customerId}`);
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event: ${event.type}`);
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Webhook] Processing error:", error);
        // ── Rollback: allow Stripe to retry ──
        await releaseEvent(event.id);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
```

### Key Design Decisions

1. **Single INSERT, not SELECT-then-INSERT.** `ON CONFLICT DO NOTHING` is atomic — no race condition between concurrent webhook deliveries.
2. **Rollback on failure.** If `updateUserTier()` throws, we `DELETE` the event ID so Stripe's next retry will reprocess it.
3. **PostgreSQL error code 23505** is the unique violation code. Supabase PostgREST may return it in `error.code`. We handle both the error path and the "no data returned" path.

---

## Mission 2: Vision Timeout Defense

### Current State Audit

| Route | File | `maxDuration` | Uses `streamObject` | Verdict |
|-------|------|--------------|---------------------|---------|
| face-reading | `src/app/api/analyze/face-reading/route.ts` | ✅ 60 | ✅ streamObject (via engine) | **PASS** |
| couple-face-scan | `src/app/api/analyze/couple-face-scan/route.ts` | ✅ 90 | ✅ streamObject (via engine) | **PASS** — reduce to 60 |
| celeb-match | `src/app/api/analyze/celeb-match/route.ts` | ✅ 60 | ✅ streamObject (via engine) | **PASS** |
| dual-modal | `src/app/api/analyze/dual-modal/route.ts` | ✅ 60 | ✅ streamObject (via engine) | **PASS** |

### Step 2.1 — Normalize `couple-face-scan` maxDuration

**File:** `src/app/api/analyze/couple-face-scan/route.ts`

**Find line 19:**
```typescript
export const maxDuration = 90;
```

**Replace with:**
```typescript
export const maxDuration = 60;
```

**Rationale:** Vercel Hobby plan allows max 60s. Keeping 90s will cause hard 504 on Hobby. The engine's internal `Promise.race` timeout (30s per model in failover chain) ensures we never actually hit 60s.

### Step 2.2 — Add graceful timeout fallback to all 4 Vision routes

For each of the following files, wrap the `streamObject`/`streamFaceReading` call in the catch block to return a user-friendly retry message instead of a raw 500:

**Files to patch:**
1. `src/app/api/analyze/face-reading/route.ts`
2. `src/app/api/analyze/couple-face-scan/route.ts`
3. `src/app/api/analyze/celeb-match/route.ts`
4. `src/app/api/analyze/dual-modal/route.ts`

**In EACH file**, find the final catch block's error response:

```typescript
        return new Response(
            JSON.stringify({ error: message }),
            { status: isRateLimit ? 429 : 500 }
        );
```

**Replace with:**

```typescript
        const isTimeout = message.includes('TIMEOUT') || message.includes('timed out');

        return new Response(
            JSON.stringify({
                error: isTimeout
                    ? 'Destiny is re-aligning. Please try again in a moment.'
                    : message,
            }),
            { status: isRateLimit ? 429 : isTimeout ? 504 : 500 }
        );
```

For `dual-modal/route.ts`, the catch block already has `isUnavailable`. Add timeout detection:

**Find in `dual-modal/route.ts`:**
```typescript
        const isRateLimit = message.includes('Rate Limit');
        const isUnavailable = message.includes('temporarily unavailable');

        return new Response(
            JSON.stringify({ error: message }),
            { status: isRateLimit ? 429 : isUnavailable ? 503 : 500 }
        );
```

**Replace with:**
```typescript
        const isRateLimit = message.includes('Rate Limit');
        const isUnavailable = message.includes('temporarily unavailable');
        const isTimeout = message.includes('TIMEOUT') || message.includes('timed out');

        return new Response(
            JSON.stringify({
                error: isTimeout
                    ? 'Destiny is re-aligning. Please try again in a moment.'
                    : message,
            }),
            { status: isRateLimit ? 429 : isTimeout ? 504 : isUnavailable ? 503 : 500 }
        );
```

---

## Mission 3: Stripe E2E Verification

### Step 3.1 — Checkout Route Verification

**File:** `src/app/api/checkout/stripe/route.ts`

**Current state: ✅ CORRECT.** The route:
- Validates plan via Zod (`basic | pro | destiny | red_flag | couple_scan | retro_mode`)
- Maps plan → `PRICE_IDS[config.priceKey]` → Stripe Price ID from env
- Correctly sets `mode: "subscription"` for pro, `mode: "payment"` for all others
- Passes `userId`, `plan`, and `tier` in `metadata` (critical for webhook)
- Returns `{ url }` for client-side redirect

**Required env vars (must exist in `.env.local` and Vercel):**
```
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxx
STRIPE_PRICE_DESTINY_LIFETIME=price_xxxxxxxx
STRIPE_PRICE_BASIC_ONETIME=price_xxxxxxxx
STRIPE_PRICE_RED_FLAG=price_xxxxxxxx
STRIPE_PRICE_COUPLE_SCAN=price_xxxxxxxx
STRIPE_PRICE_RETRO_MODE=price_xxxxxxxx
```

**NO CODE CHANGES NEEDED.**

### Step 3.2 — Webhook → Supabase Tier Update Verification

**File:** `src/app/api/stripe/webhook/route.ts`

After Mission 1 patch, the webhook:
- Verifies Stripe signature via `constructWebhookEvent()`
- Claims event atomically via `stripe_events` table
- Extracts `userId` from `session.metadata.userId`
- Upserts `user_subscriptions.subscription_tier` via `updateUserTier()`
- For IAPs: inserts into `user_iap_purchases`
- On failure: releases event for retry

**Target table:** `user_subscriptions` (created in `20260223_stripe_subscriptions.sql`)

**NO ADDITIONAL CODE CHANGES NEEDED** — Mission 1 patch covers this.

### Step 3.3 — PaywallGate Reads subscription_tier

**File:** `src/components/paywall/PaywallGate.tsx`

**Current state:** The component accepts `tier` as a prop. The PARENT component that renders PaywallGate must fetch the user's `subscription_tier` from Supabase and pass it.

**Required integration point:** The page rendering PaywallGate must:

```typescript
// In any page using PaywallGate (e.g., result/[id]/page.tsx):
import { createClient } from '@/lib/supabase/server';

// Inside the server component:
const supabase = createClient();
const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single();

const userTier = (sub?.subscription_tier || 'free') as 'free' | 'basic' | 'pro' | 'destiny';

// Pass to PaywallGate:
<PaywallGate tier={userTier} requiredTier="basic">
    {/* Premium content */}
</PaywallGate>
```

**Action for Claude Code:** Find every file that renders `<PaywallGate` and ensure it fetches the tier from `user_subscriptions`. If it's currently hardcoded as `tier="free"`, replace with the Supabase query above.

### Step 3.4 — Create E2E test checklist

**Create file:** `docs/STRIPE_E2E_TEST.md`

```markdown
# OHANG Stripe E2E Test Checklist

## Prerequisites
- [ ] Stripe test mode keys in `.env.local`
- [ ] All 6 `STRIPE_PRICE_*` env vars set to test Price IDs
- [ ] `STRIPE_WEBHOOK_SECRET` set (use `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- [ ] Supabase migrations applied: `20260223_stripe_subscriptions.sql` + `20260226_stripe_idempotency.sql`

## Test 1: Pro Subscription Flow
- [ ] POST `/api/checkout/stripe` with `{ "plan": "pro" }` → Returns `{ url }` starting with `https://checkout.stripe.com`
- [ ] Complete checkout with test card `4242 4242 4242 4242`
- [ ] Webhook `checkout.session.completed` received
- [ ] `user_subscriptions` row created with `subscription_tier = 'pro'`
- [ ] `stripe_events` row created with event ID
- [ ] PaywallGate shows unblurred content for `requiredTier="basic"` and `requiredTier="pro"`

## Test 2: Destiny Lifetime Purchase
- [ ] POST `/api/checkout/stripe` with `{ "plan": "destiny" }` → Returns checkout URL
- [ ] Complete checkout → `subscription_tier = 'destiny'`
- [ ] PaywallGate shows all content unblurred

## Test 3: IAP (Red Flag) One-Time Payment
- [ ] POST `/api/checkout/stripe` with `{ "plan": "red_flag" }` → Returns checkout URL
- [ ] Complete checkout → `user_iap_purchases` row with `feature = 'red_flag'`
- [ ] Red Flag API route accessible for this user

## Test 4: Subscription Cancellation
- [ ] Cancel subscription in Stripe Dashboard
- [ ] Webhook `customer.subscription.deleted` received
- [ ] `subscription_tier` reverted to `'free'`
- [ ] PaywallGate re-activates blur

## Test 5: Idempotency
- [ ] Send same webhook event twice (re-deliver from Stripe Dashboard)
- [ ] Second delivery returns `{ received: true, duplicate: true }`
- [ ] No double entries in `user_subscriptions` or `user_iap_purchases`
- [ ] `stripe_events` table has exactly 1 row for the event ID

## Test 6: Webhook Failure Recovery
- [ ] Temporarily make `updateUserTier()` throw (add `throw new Error('test')`)
- [ ] Send webhook → Returns 500
- [ ] Check `stripe_events` table → Event ID was DELETED (released for retry)
- [ ] Remove the throw, let Stripe retry → Event processes successfully

## Test 7: Vision Timeout Graceful Degradation
- [ ] Set extremely short timeout in engine failover chain (e.g., 1ms)
- [ ] Call face-reading API → Returns 504 with `"Destiny is re-aligning. Please try again in a moment."`
- [ ] Restore normal timeouts

## Test 8: Payment Failed Handling
- [ ] Use declining test card `4000 0000 0000 0002`
- [ ] `invoice.payment_failed` event logged
- [ ] User tier NOT downgraded (grace period)
```

---

## Execution Order

1. **Create migration** `supabase/migrations/20260226_stripe_idempotency.sql`
2. **Rewrite** `src/app/api/stripe/webhook/route.ts` (Mission 1 — full file replacement)
3. **Patch** `src/app/api/analyze/couple-face-scan/route.ts` — change `maxDuration = 90` → `60`
4. **Patch** 4 Vision route catch blocks with timeout detection (Mission 2.2)
5. **Create** `docs/STRIPE_E2E_TEST.md` (Mission 3.4)
6. **Verify build:** `npm run build`

---

## Files Modified (Summary)

| # | File | Action | Mission |
|---|------|--------|---------|
| 1 | `supabase/migrations/20260226_stripe_idempotency.sql` | CREATE | 1 |
| 2 | `src/app/api/stripe/webhook/route.ts` | REWRITE | 1 |
| 3 | `src/app/api/analyze/couple-face-scan/route.ts` | PATCH (maxDuration + catch) | 2 |
| 4 | `src/app/api/analyze/face-reading/route.ts` | PATCH (catch block) | 2 |
| 5 | `src/app/api/analyze/celeb-match/route.ts` | PATCH (catch block) | 2 |
| 6 | `src/app/api/analyze/dual-modal/route.ts` | PATCH (catch block) | 2 |
| 7 | `docs/STRIPE_E2E_TEST.md` | CREATE | 3 |

## Files NOT Modified (Integrity Preserved)

- `src/lib/saju/engine.ts` — SajuEngine untouched
- `src/lib/ai/engine.ts` — OhangEngine untouched
- `src/lib/ai/prompts/*` — All prompts untouched
- `src/components/paywall/PaywallGate.tsx` — UI untouched
- `src/lib/stripe/index.ts` — Stripe module untouched
- `src/app/api/checkout/stripe/route.ts` — Already correct

---

*Generated: 2026-02-26 | OHANG Phase A Survival Shield v1.0.0*
