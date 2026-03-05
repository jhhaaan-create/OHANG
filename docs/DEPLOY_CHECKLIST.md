# OHANG — Vercel Production Deploy Checklist

> **Last Updated**: 2026-03-03
> **Status**: Pre-launch

## 1. Mandatory Environment Variables

ALL of these must be set in Vercel → Project Settings → Environment Variables.
Missing ANY one will cause runtime failures.

| Variable | Source | Description |
|----------|--------|-------------|
| `OPENAI_API_KEY` | OpenAI Dashboard | API key for GPT-4o / GPT-4o-mini |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | Server-side Stripe key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | Webhook signing secret (whsec_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys | Client-side Stripe key (pk_live_...) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Service role key (server only) |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob | Token for image uploads |

### Stripe Price IDs (one per product)

| Variable | Stripe Product | Amount |
|----------|---------------|--------|
| `STRIPE_PRICE_BASIC_ONETIME` | Basic one-time reading | $2.99 |
| `STRIPE_PRICE_PRO_MONTHLY` | OHANG+ monthly subscription | $7.99/mo |
| `STRIPE_PRICE_OHANG_PRO_MONTHLY` | OHANG Pro monthly subscription | $19.99/mo |
| `STRIPE_PRICE_DESTINY_LIFETIME` | Destiny lifetime | $39.99 |
| `STRIPE_PRICE_RED_FLAG` | Red Flag Radar IAP | $2.99 |
| `STRIPE_PRICE_COUPLE_SCAN` | Couple Face Scan IAP | $2.99 |
| `STRIPE_PRICE_RETRO_MODE` | Retro Mode IAP | $1.99 |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Auto-detected | Production URL (https://ohang.app) |
| `NODE_ENV` | `production` | Set automatically by Vercel |

---

## 2. Stripe Dashboard Setup

### Products & Prices

Create 7 products in Stripe Dashboard → Products:

1. **Basic Reading** → One-time $2.99 → Copy Price ID → `STRIPE_PRICE_BASIC_ONETIME`
2. **OHANG+ Monthly** → Recurring $7.99/mo → Copy Price ID → `STRIPE_PRICE_PRO_MONTHLY`
3. **OHANG Pro Monthly** → Recurring $19.99/mo → Copy Price ID → `STRIPE_PRICE_OHANG_PRO_MONTHLY`
4. **Destiny Lifetime** → One-time $39.99 → Copy Price ID → `STRIPE_PRICE_DESTINY_LIFETIME`
5. **Red Flag Radar** → One-time $2.99 → Copy Price ID → `STRIPE_PRICE_RED_FLAG`
6. **Couple Face Scan** → One-time $2.99 → Copy Price ID → `STRIPE_PRICE_COUPLE_SCAN`
7. **Retro Mode** → One-time $1.99 → Copy Price ID → `STRIPE_PRICE_RETRO_MODE`

### Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://ohang.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

---

## 3. Supabase Migrations

Run all migrations in order before deploy:

```
supabase/migrations/20260223_stripe_subscriptions.sql  → user_subscriptions + user_iap_purchases
supabase/migrations/20260226_stripe_idempotency.sql     → stripe_events (webhook dedup)
```

Verify tables exist with correct RLS:
- `user_subscriptions` (RLS: service_role write, auth read-own)
- `user_iap_purchases` (RLS: service_role write, auth read-own)
- `stripe_events` (RLS: service_role only)

---

## 4. Vercel Project Settings

- **Framework**: Next.js (auto-detected)
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Node.js Version**: 18.x or 20.x
- **Install Command**: `npm install` or `pnpm install`

### Serverless Function Limits

| Route Pattern | `maxDuration` | Notes |
|---------------|---------------|-------|
| `/api/analyze/*` | 60s | AI streaming routes |
| `/api/stripe/webhook` | 30s | Webhook processing |
| `/api/og/*` | 10s | Image generation |
| `/api/checkout/*` | 15s | Stripe session creation |

---

## 5. Domain & DNS

1. Add custom domain in Vercel: `ohang.app`
2. Configure DNS records:
   - `A` record → `76.76.21.21`
   - `CNAME` www → `cname.vercel-dns.com`
3. Automatic HTTPS enabled by default
4. Set `NEXT_PUBLIC_APP_URL=https://ohang.app` in env vars

---

## 6. Pre-Deploy Checklist

```
[ ] All 8 mandatory env vars set in Vercel
[ ] All 7 Stripe Price ID env vars set
[ ] Stripe webhook endpoint registered and active
[ ] Supabase migrations applied (2 migration files)
[ ] Supabase RLS policies verified
[ ] `npm run build` passes locally with ZERO errors
[ ] TypeScript strict mode passes
[ ] Test Stripe checkout in test mode (stripe listen --forward-to)
[ ] Verify webhook event processing
[ ] OG image renders: /api/og?archetype=test&element=Fire
[ ] Image upload to Vercel Blob works
[ ] Landing page renders correctly on mobile
```

---

## 7. Post-Deploy Verification

```
[ ] Landing page loads at https://ohang.app
[ ] CTA "Discover Your Archetype" → /analyze
[ ] /analyze page: form submission → CelestialLoading → result
[ ] Bottom nav visible on /features, /pricing, /profile
[ ] /features page: all feature cards link correctly
[ ] /pricing page: CTA buttons trigger Stripe checkout
[ ] Stripe checkout completes → webhook fires → tier updates in Supabase
[ ] /features/celeb-match: photo upload + result (FREE)
[ ] /features/red-flag: birth data input + result
[ ] /features/couple-scan: dual photo upload + result
[ ] /features/retro-mode: birth data input + result
[ ] OG images render on Twitter/Facebook/Slack share
[ ] Mobile responsive: all pages render correctly on 375px width
```

---

## 8. Monitoring & Observability

| Tool | Purpose | Already Integrated? |
|------|---------|-------------------|
| Vercel Analytics | Page views, Web Vitals | ✅ Yes |
| Stripe Dashboard | Payment + webhook health | ✅ Yes (manual) |
| Supabase Dashboard | DB health, RLS failures | ✅ Yes (manual) |
| Sentry | Runtime error tracking | ❌ Recommended |
| Vercel Speed Insights | Core Web Vitals | ❌ Optional |

---

## 9. Security Checklist

```
[ ] STRIPE_SECRET_KEY is NOT exposed to client (no NEXT_PUBLIC_ prefix)
[ ] SUPABASE_SERVICE_ROLE_KEY is NOT exposed to client
[ ] OPENAI_API_KEY is NOT exposed to client
[ ] Middleware blocks unauthorized origins in production
[ ] Bot detection active on API routes
[ ] Stripe webhook verifies signature before processing
[ ] Webhook idempotency via stripe_events table active
[ ] RLS enabled on all Supabase tables
[ ] No console.log of sensitive data in production
```
