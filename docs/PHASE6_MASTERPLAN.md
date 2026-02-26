# OHANG Phase 6: 0.01% Market Domination Architecture

> **Version:** 1.0.0
> **Date:** 2026-02-23
> **Constraint:** Zero modifications to existing `engine.ts`, `ai/engine.ts`, or Supabase schema columns.
> **Pattern:** Every new module is a _sidecar_ — loosely coupled, independently deployable.

---

## Table of Contents

1. [Masterplan 1 — Time-Synchronized Push](#1-time-synchronized-push)
2. [Masterplan 2 — Synchronicity Feed](#2-synchronicity-feed)
3. [Masterplan 3 — B2B API Ecosystem](#3-b2b-api-ecosystem)
4. [Masterplan 4 — Hyper-Local Cultural Mapping](#4-hyper-local-cultural-mapping)
5. [Masterplan 5 — Physical Manifestation Engine](#5-physical-manifestation-engine)
6. [Shared Infrastructure](#6-shared-infrastructure)
7. [Database Migration Strategy](#7-database-migration-strategy)
8. [Execution Command](#8-execution-command)

---

## 1. Time-Synchronized Push

**Concept:** Send push notifications at astronomically precise moments (e.g., when the user's favorable element peaks in the daily pillar cycle). Uses `todayPillar.ts` as the clock, not arbitrary cron schedules.

### 1.1 Directory Structure

```
src/
  lib/
    push/
      index.ts              # Push service facade (OneSignal + FCM adapter)
      scheduler.ts          # Cron job: calculates optimal send windows per user
      templates.ts          # Notification copy templates by element + archetype
      types.ts              # PushSubscription, PushEvent, PushWindow types
  app/
    api/
      push/
        subscribe/route.ts  # POST — register device token + user element profile
        unsubscribe/route.ts # DELETE — remove subscription
        trigger/route.ts    # POST — internal: Supabase Edge Function webhook target
supabase/
  migrations/
    20260224_push_subscriptions.sql
  functions/
    push-scheduler/
      index.ts              # Edge Function: runs every 15min, resolves windows, calls /api/push/trigger
```

### 1.2 Data Flow

```
┌──────────────────┐   every 15min   ┌─────────────────────┐
│ Supabase pg_cron  │───────────────▶│ push-scheduler       │
│ (trigger)         │                │ Edge Function         │
└──────────────────┘                └──────────┬──────────┘
                                               │
                    1. SELECT users WHERE       │
                       next_push_window <= NOW()│
                    2. getTodayPillar() check    │
                                               ▼
                                    ┌─────────────────────┐
                                    │ /api/push/trigger    │
                                    │ (internal route)     │
                                    └──────────┬──────────┘
                                               │
                         3. Resolve template    │
                            by user archetype   │
                            + daily element     │
                                               ▼
                                    ┌─────────────────────┐
                                    │ OneSignal / FCM API  │
                                    │ (external)           │
                                    └─────────────────────┘
```

### 1.3 Database Table

```sql
-- 20260224_push_subscriptions.sql
CREATE TABLE push_subscriptions (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     TEXT NOT NULL,
    device_token TEXT NOT NULL,
    platform    TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    archetype   TEXT,               -- cached from last analysis
    day_master  TEXT,               -- cached dominant element
    timezone    TEXT DEFAULT 'Asia/Seoul',
    next_push_window TIMESTAMPTZ,   -- pre-calculated optimal send time
    enabled     BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_next_window ON push_subscriptions (next_push_window)
    WHERE enabled = TRUE;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_push_full"
    ON push_subscriptions FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "user_manage_own_push"
    ON push_subscriptions FOR ALL
    TO authenticated
    USING (user_id = auth.uid()::TEXT)
    WITH CHECK (user_id = auth.uid()::TEXT);
```

### 1.4 Scheduler Logic (scheduler.ts)

```typescript
import { getTodayPillar } from '@/lib/vibe/todayPillar';

// Element affinity windows: when a user's day_master element
// is "fed" by the daily pillar's element, it's the optimal moment.
const ELEMENT_FEED: Record<string, string> = {
    Wood: 'Water',   // Water feeds Wood
    Fire: 'Wood',    // Wood feeds Fire
    Earth: 'Fire',   // Fire feeds Earth
    Metal: 'Earth',  // Earth feeds Metal
    Water: 'Metal',  // Metal feeds Water
};

export function calculateNextWindow(
    dayMaster: string,
    timezone: string
): Date {
    // Walk forward through the next 3 days of pillars
    // Find the first day where the pillar's stem_element
    // or branch_element matches the user's "feeder" element.
    const feeder = ELEMENT_FEED[dayMaster];
    const now = new Date();

    for (let offset = 0; offset < 3; offset++) {
        const target = new Date(now);
        target.setDate(target.getDate() + offset);
        const pillar = getTodayPillar(target);

        if (pillar.stem_element === feeder || pillar.branch_element === feeder) {
            // Send at 8:30 AM user's local time on that day
            target.setHours(8, 30, 0, 0);
            return target;
        }
    }

    // Fallback: tomorrow 9 AM
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);
    return fallback;
}
```

### 1.5 Third-Party Integration

| Service | Purpose | Env Variable |
|---------|---------|-------------|
| OneSignal | Web push + mobile push | `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY` |
| FCM (fallback) | Android native push | `FCM_SERVER_KEY` |
| Supabase pg_cron | 15-min scheduler trigger | Built-in (enable via Dashboard) |

---

## 2. Synchronicity Feed

**Concept:** A real-time social feed showing anonymized "cosmic moments" — when two strangers share the same archetype today, when a rare pillar combination occurs, when element balance shifts globally. Think "Spotify Wrapped" but live and daily.

### 2.1 Directory Structure

```
src/
  lib/
    feed/
      index.ts              # Feed service: fetch, compose, cache
      realtime.ts           # Supabase Realtime subscription manager
      composers/
        pillar-event.ts     # "Today's pillar is 甲子 — rare Wood+Water day"
        archetype-wave.ts   # "47 users share The Muse archetype today"
        element-shift.ts    # "Global Fire energy is peaking this hour"
      types.ts              # FeedItem, FeedEvent, FeedComposition
  app/
    api/
      feed/
        stream/route.ts     # GET — SSE stream of live feed events
        history/route.ts    # GET — paginated past feed items
    (main)/
      feed/
        page.tsx            # Server shell
        FeedClient.tsx      # Client component: real-time feed UI
  components/
    feed/
      FeedCard.tsx          # Individual feed item card
      FeedSkeleton.tsx      # Loading state
      LiveIndicator.tsx     # Pulsing "LIVE" badge
```

### 2.2 Data Flow

```
┌─────────────────┐    INSERT     ┌──────────────────┐
│ /api/saju        │─────────────▶│ feed_events table │
│ (on each         │  (side-effect │ (Supabase)       │
│  analysis)       │   via DB fn)  │                   │
└─────────────────┘               └────────┬─────────┘
                                           │
                          Supabase Realtime │ (WebSocket)
                          broadcast on     │
                          INSERT           │
                                           ▼
┌─────────────────┐                ┌──────────────────┐
│ FeedClient.tsx   │◀──────────────│ /api/feed/stream │
│ (SSE / WS)      │   Server-Sent │ (SSE endpoint)   │
│                  │   Events      │                   │
└─────────────────┘               └──────────────────┘
```

### 2.3 Database Tables

```sql
-- 20260224_feed_events.sql
CREATE TABLE feed_events (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type  TEXT NOT NULL CHECK (event_type IN (
        'pillar_shift', 'archetype_wave', 'element_peak',
        'rare_combination', 'milestone'
    )),
    payload     JSONB NOT NULL,     -- { element, count, archetype, pillar, ... }
    locale      TEXT DEFAULT 'ko',
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feed_events_created ON feed_events (created_at DESC);
CREATE INDEX idx_feed_events_type ON feed_events (event_type, created_at DESC);

ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_feed_full"
    ON feed_events FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_can_read_feed"
    ON feed_events FOR SELECT
    TO authenticated, anon
    USING (expires_at > NOW());

-- Aggregation table for archetype counts (updated by DB trigger)
CREATE TABLE feed_archetype_counts (
    date        DATE NOT NULL,
    archetype   TEXT NOT NULL,
    count       INTEGER DEFAULT 0,
    PRIMARY KEY (date, archetype)
);

ALTER TABLE feed_archetype_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_counts_full"
    ON feed_archetype_counts FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anyone_can_read_counts"
    ON feed_archetype_counts FOR SELECT
    TO authenticated, anon USING (true);

-- Trigger function: on each saju analysis, update counts + emit feed event
CREATE OR REPLACE FUNCTION fn_feed_on_analysis()
RETURNS TRIGGER AS $$
DECLARE
    v_archetype TEXT;
    v_count     INTEGER;
BEGIN
    -- Extract archetype from the analysis log
    v_archetype := NEW.metadata->>'archetype';
    IF v_archetype IS NULL THEN RETURN NEW; END IF;

    -- Upsert archetype count
    INSERT INTO feed_archetype_counts (date, archetype, count)
    VALUES (CURRENT_DATE, v_archetype, 1)
    ON CONFLICT (date, archetype)
    DO UPDATE SET count = feed_archetype_counts.count + 1
    RETURNING count INTO v_count;

    -- Emit feed event at milestones (10, 50, 100, 500, ...)
    IF v_count IN (10, 50, 100, 500, 1000, 5000) THEN
        INSERT INTO feed_events (event_type, payload, expires_at)
        VALUES (
            'archetype_wave',
            jsonb_build_object(
                'archetype', v_archetype,
                'count', v_count,
                'date', CURRENT_DATE
            ),
            CURRENT_DATE + INTERVAL '1 day'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.4 SSE Stream Route

```typescript
// /api/feed/stream/route.ts
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET() {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const channel = supabase
                .channel('feed-events')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'feed_events' },
                    (payload) => {
                        const data = `data: ${JSON.stringify(payload.new)}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }
                )
                .subscribe();

            // Cleanup on disconnect
            const cleanup = () => { supabase.removeChannel(channel); };
            controller.close = cleanup;
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
```

### 2.5 Third-Party Integration

| Service | Purpose | Env Variable |
|---------|---------|-------------|
| Supabase Realtime | WebSocket broadcast on INSERT | Built-in |
| Vercel Edge Runtime | SSE streaming without timeout | Built-in |

---

## 3. B2B API Ecosystem

**Concept:** Expose OHANG's Saju analysis as a versioned REST API for third-party dating apps, wellness platforms, and HR tools. Monetized via Stripe metered billing with API key authentication.

### 3.1 Directory Structure

```
src/
  lib/
    b2b/
      index.ts              # B2B service facade
      auth.ts               # API key validation + rate limiting
      billing.ts            # Stripe metered usage reporting
      transform.ts          # Response transformer (full → B2B subset)
      types.ts              # B2BClient, B2BRequest, B2BResponse, APIKeyMeta
  app/
    api/
      v1/
        b2b/
          analyze/route.ts      # POST — single person Saju analysis
          chemistry/route.ts    # POST — two-person compatibility
          daily-pillar/route.ts # GET  — today's pillar + element forecast
          face-reading/route.ts # POST — face reading (image upload)
        b2b-keys/
          route.ts              # POST/GET — manage API keys (authenticated)
          [keyId]/
            route.ts            # PATCH/DELETE — update/revoke single key
    (main)/
      developer/
        page.tsx            # Developer portal (API key management UI)
        DeveloperClient.tsx # Client component
supabase/
  migrations/
    20260224_b2b_api_keys.sql
```

### 3.2 Data Flow

```
┌───────────────────┐   API Key +   ┌──────────────────────┐
│ Third-Party App    │   JSON body   │ /api/v1/b2b/analyze  │
│ (Dating App, HR)   │─────────────▶│                      │
└───────────────────┘               └──────────┬───────────┘
                                               │
                    1. Validate API key         │
                       (b2b/auth.ts)            │
                    2. Check rate limit         │
                       (per-key tier)           │
                    3. Deduct usage             │
                                               ▼
                                    ┌──────────────────────┐
                                    │ SajuEngine.compute() │
                                    │ (existing V1 engine) │
                                    └──────────┬───────────┘
                                               │
                    4. formatChartToAiContext()  │
                    5. OhangEngine.stream()     │
                       (optional: AI layer)     │
                                               ▼
                                    ┌──────────────────────┐
                                    │ b2b/transform.ts     │
                                    │ (strip internal,     │
                                    │  format for B2B)     │
                                    └──────────┬───────────┘
                                               │
                    6. Log usage to Stripe      │
                       metered billing          │
                    7. Return B2BResponse       │
                                               ▼
                                    ┌──────────────────────┐
                                    │ Stripe Usage Record  │
                                    │ (metered billing)    │
                                    └──────────────────────┘
```

### 3.3 Database Tables

```sql
-- 20260224_b2b_api_keys.sql
CREATE TABLE b2b_api_keys (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         TEXT NOT NULL,          -- owner (must be authenticated)
    key_hash        TEXT NOT NULL UNIQUE,    -- SHA-256 of the API key
    key_prefix      TEXT NOT NULL,           -- first 8 chars for display: "ohng_xxxx"
    name            TEXT NOT NULL,           -- human label: "My Dating App"
    tier            TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'growth', 'enterprise')),
    rate_limit      INTEGER NOT NULL DEFAULT 100,   -- requests per minute
    monthly_quota   INTEGER NOT NULL DEFAULT 1000,  -- requests per month
    used_this_month INTEGER DEFAULT 0,
    stripe_subscription_id TEXT,            -- linked Stripe subscription for metered billing
    stripe_item_id  TEXT,                   -- Stripe subscription item for usage reporting
    permissions     JSONB DEFAULT '["analyze", "daily-pillar"]'::JSONB,
    is_active       BOOLEAN DEFAULT TRUE,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_b2b_key_hash ON b2b_api_keys (key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_b2b_user ON b2b_api_keys (user_id);

-- Usage log for audit trail
CREATE TABLE b2b_usage_log (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_id      UUID NOT NULL REFERENCES b2b_api_keys(id),
    endpoint    TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    latency_ms  INTEGER,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_b2b_usage_created ON b2b_usage_log (created_at DESC);
CREATE INDEX idx_b2b_usage_key ON b2b_usage_log (key_id, created_at DESC);

-- RLS
ALTER TABLE b2b_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_b2b_full"
    ON b2b_api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_manage_own_keys"
    ON b2b_api_keys FOR ALL TO authenticated
    USING (user_id = auth.uid()::TEXT) WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "service_role_usage_full"
    ON b2b_usage_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_read_own_usage"
    ON b2b_usage_log FOR SELECT TO authenticated
    USING (key_id IN (SELECT id FROM b2b_api_keys WHERE user_id = auth.uid()::TEXT));

-- Monthly quota reset function (pg_cron: 1st of each month at 00:00 UTC)
CREATE OR REPLACE FUNCTION fn_reset_b2b_monthly_quota()
RETURNS void AS $$
BEGIN
    UPDATE b2b_api_keys SET used_this_month = 0 WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.4 API Key Authentication (auth.ts)

```typescript
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface APIKeyMeta {
    keyId: string;
    userId: string;
    tier: string;
    rateLimit: number;
    permissions: string[];
}

export async function validateAPIKey(req: Request): Promise<APIKeyMeta | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ohng_')) return null;

    const rawKey = authHeader.slice(7); // "Bearer " = 7 chars
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const { data, error } = await supabaseAdmin
        .from('b2b_api_keys')
        .select('id, user_id, tier, rate_limit, permissions, monthly_quota, used_this_month')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .is('revoked_at', null)
        .single();

    if (error || !data) return null;

    // Check monthly quota
    if (data.used_this_month >= data.monthly_quota) return null;

    // Increment usage
    await supabaseAdmin
        .from('b2b_api_keys')
        .update({
            used_this_month: data.used_this_month + 1,
            last_used_at: new Date().toISOString(),
        })
        .eq('id', data.id);

    return {
        keyId: data.id,
        userId: data.user_id,
        tier: data.tier,
        rateLimit: data.rate_limit,
        permissions: data.permissions as string[],
    };
}
```

### 3.5 Tier Pricing

| Tier | Rate Limit | Monthly Quota | Price | Features |
|------|-----------|--------------|-------|----------|
| Free | 10/min | 100/month | $0 | `analyze`, `daily-pillar` |
| Starter | 60/min | 5,000/month | $49/mo | + `chemistry` |
| Growth | 300/min | 50,000/month | $199/mo | + `face-reading`, priority support |
| Enterprise | Custom | Custom | Contact | Custom SLA, dedicated support |

### 3.6 Third-Party Integration

| Service | Purpose | Env Variable |
|---------|---------|-------------|
| Stripe Metered Billing | Per-request billing | `STRIPE_SECRET_KEY` (existing) |
| Stripe Usage Records | Report API consumption | `STRIPE_SECRET_KEY` |

---

## 4. Hyper-Local Cultural Mapping

**Concept:** Dynamically adjust AI interpretation prompts based on the user's locale and cultural context. A Korean user gets traditional Saju framing; a Brazilian user gets Candomblé-influenced element mapping; a Japanese user gets Onmyōdō overtones.

### 4.1 Directory Structure

```
src/
  lib/
    culture/
      index.ts              # Culture service facade
      detector.ts           # Locale detection (Accept-Language, Geolocation, user pref)
      mappings/
        ko.ts               # Korean: 오행 (五行) traditional framing
        ja.ts               # Japanese: 陰陽道 (Onmyōdō) overtones
        zh.ts               # Chinese: 五行 classical / feng shui emphasis
        en-us.ts            # US English: modern wellness / astrology hybrid
        pt-br.ts            # Brazilian: Candomblé elemental resonance
        es.ts               # Spanish: Mesoamerican calendar parallels
        default.ts          # Fallback: neutral universal framing
      types.ts              # CultureMapping, LocaleConfig, CulturalPromptLayer
  app/
    api/
      culture/
        detect/route.ts     # GET — returns detected locale + available mappings
        preferences/route.ts # POST/GET — user locale preferences CRUD
supabase/
  migrations/
    20260224_user_locale_preferences.sql
```

### 4.2 Data Flow

```
┌───────────────────┐   Accept-Language  ┌────────────────────┐
│ User Request       │   + Geo headers   │ culture/detector.ts│
│ (any analysis API) │──────────────────▶│                    │
└───────────────────┘                    └────────┬───────────┘
                                                  │
                          1. Detect locale         │
                          2. Load culture mapping  │
                                                  ▼
                                        ┌────────────────────┐
                                        │ mappings/ko.ts     │
                                        │ (or ja, zh, etc.)  │
                                        └────────┬───────────┘
                                                  │
                          3. Inject cultural       │
                             prompt layer into     │
                             OhangEngine context   │
                                                  ▼
                                        ┌────────────────────┐
                                        │ OhangEngine        │
                                        │ .streamArchetype() │
                                        │ (existing AI)      │
                                        └────────────────────┘
```

### 4.3 Cultural Mapping Interface

```typescript
// culture/types.ts
export interface CultureMapping {
    locale: string;                     // e.g., 'ko', 'ja', 'en-us'
    display_name: string;               // e.g., '한국어 (전통 사주)'
    element_names: Record<string, string>;  // { Wood: '목(木)', Fire: '화(火)', ... }
    archetype_titles: Record<string, string>;
    system_prompt_layer: string;        // Injected into AI system prompt
    cultural_references: string[];      // Cultural touchpoints for AI to weave in
    tone: 'formal' | 'casual' | 'mystical' | 'analytical';
    calendar_system: 'solar' | 'lunar' | 'mixed';
}

// Example: ko.ts
export const KO_MAPPING: CultureMapping = {
    locale: 'ko',
    display_name: '한국어 (전통 사주)',
    element_names: {
        Wood: '목(木)', Fire: '화(火)', Earth: '토(土)',
        Metal: '금(金)', Water: '수(水)',
    },
    archetype_titles: {
        'The Peer': '비견(比肩)',
        'The Muse': '식신(食神)',
        'The Icon': '정관(正官)',
        // ... etc.
    },
    system_prompt_layer: `
        You are interpreting Saju (사주팔자) in the Korean tradition.
        Use honorific Korean sentence endings (합니다 체).
        Reference Korean cultural touchstones: 정(情), 인연(因緣), 팔자(八字).
        Frame advice through Confucian relational harmony (오륜).
        Weave in seasonal Korean references (24절기).
    `,
    cultural_references: ['정(情)', '인연(因緣)', '팔자(八字)', '운명(運命)', '사주카페'],
    tone: 'mystical',
    calendar_system: 'mixed',
};
```

### 4.4 Database Table

```sql
-- 20260224_user_locale_preferences.sql
CREATE TABLE user_locale_preferences (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     TEXT NOT NULL UNIQUE,
    locale      TEXT NOT NULL DEFAULT 'ko',
    auto_detect BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_locale_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_locale_full"
    ON user_locale_preferences FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "user_manage_own_locale"
    ON user_locale_preferences FOR ALL
    TO authenticated
    USING (user_id = auth.uid()::TEXT)
    WITH CHECK (user_id = auth.uid()::TEXT);
```

### 4.5 Prompt Injection Point

The cultural layer is injected as a **system prompt suffix** in the existing `OhangEngine`, without modifying the engine itself:

```typescript
// In any analysis API route, BEFORE calling OhangEngine:
import { detectCulture } from '@/lib/culture/detector';
import { getCultureMapping } from '@/lib/culture';

const locale = await detectCulture(req);
const culture = getCultureMapping(locale);

// Append cultural layer to the existing context
const enhancedContext = {
    ...ohangContext,
    cultural_layer: culture.system_prompt_layer,
    element_names: culture.element_names,
    locale: culture.locale,
};
```

### 4.6 Third-Party Integration

| Service | Purpose | Env Variable |
|---------|---------|-------------|
| Vercel Geolocation | IP-to-country detection | Built-in (`req.geo`) |
| Accept-Language header | Browser locale detection | Built-in |

---

## 5. Physical Manifestation Engine

**Concept:** Generate personalized physical goods (element-themed prints, birth chart posters, compatibility scrolls) via print-on-demand integration. Users order directly from the result page.

### 5.1 Directory Structure

```
src/
  lib/
    merch/
      index.ts              # Merch service facade
      designer.ts           # SVG/Canvas template renderer
      templates/
        birth-chart.ts      # Birth chart poster template (SVG)
        element-card.ts     # Element card design
        compatibility.ts    # Compatibility scroll design
      fulfillment.ts        # Printful/Gelato API adapter
      types.ts              # MerchProduct, OrderRequest, FulfillmentStatus
  app/
    api/
      merch/
        preview/route.ts    # POST — generate preview image (no payment)
        order/route.ts      # POST — create order (Stripe + Printful)
        webhook/route.ts    # POST — Printful fulfillment webhook
        status/[orderId]/
          route.ts          # GET — order tracking
    (main)/
      shop/
        page.tsx            # Server shell: product catalog
        ShopClient.tsx      # Client: product customizer + preview
      result/
        [id]/
          merch/
            page.tsx        # "Get your results as a poster" CTA
  components/
    merch/
      ProductPreview.tsx    # Live preview with user's chart data
      OrderButton.tsx       # Purchase CTA with Stripe checkout
      FulfillmentTracker.tsx # Order status timeline
supabase/
  migrations/
    20260224_merch_orders.sql
```

### 5.2 Data Flow

```
┌──────────────────┐  1. "Make Poster"  ┌───────────────────┐
│ Result Page        │───────────────────▶│ /api/merch/preview│
│ (user sees result) │                   │                   │
└──────────────────┘                    └─────────┬─────────┘
                                                  │
                        2. Render SVG template     │
                           with user's chart data  │
                        3. Return preview image    │
                                                  ▼
┌──────────────────┐  4. "Order Now"    ┌───────────────────┐
│ ProductPreview     │───────────────────▶│ /api/merch/order  │
│ (shows preview)    │                   │                   │
└──────────────────┘                    └─────────┬─────────┘
                                                  │
                        5. Create Stripe Checkout  │
                        6. On payment success:     │
                           POST to Printful API    │
                                                  ▼
                                        ┌───────────────────┐
                                        │ Printful API       │
                                        │ (print + ship)     │
                                        └─────────┬─────────┘
                                                  │
                        7. Webhook: status updates │
                                                  ▼
                                        ┌───────────────────┐
                                        │ /api/merch/webhook │
                                        │ → update order DB  │
                                        └───────────────────┘
```

### 5.3 Database Tables

```sql
-- 20260224_merch_orders.sql
CREATE TABLE merch_products (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,       -- 'birth-chart-poster', 'element-card'
    name        TEXT NOT NULL,
    description TEXT,
    base_price  INTEGER NOT NULL,           -- in cents (USD)
    printful_variant_id TEXT,               -- Printful product variant
    template    TEXT NOT NULL,              -- template key: 'birth-chart', 'element-card'
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE merch_orders (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             TEXT NOT NULL,
    product_id          UUID NOT NULL REFERENCES merch_products(id),
    result_id           TEXT,                   -- link to analysis result
    chart_data          JSONB NOT NULL,         -- snapshot of SajuChart at order time
    customization       JSONB DEFAULT '{}'::JSONB, -- color scheme, name, etc.
    stripe_checkout_id  TEXT,
    stripe_payment_id   TEXT,
    printful_order_id   TEXT,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    )),
    shipping_address    JSONB,
    tracking_number     TEXT,
    tracking_url        TEXT,
    total_cents         INTEGER NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merch_orders_user ON merch_orders (user_id, created_at DESC);
CREATE INDEX idx_merch_orders_status ON merch_orders (status);
CREATE INDEX idx_merch_orders_printful ON merch_orders (printful_order_id);

-- RLS
ALTER TABLE merch_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_products"
    ON merch_products FOR SELECT TO authenticated, anon USING (is_active = TRUE);
CREATE POLICY "service_role_products_full"
    ON merch_products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_orders_full"
    ON merch_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_read_own_orders"
    ON merch_orders FOR SELECT TO authenticated
    USING (user_id = auth.uid()::TEXT);
```

### 5.4 Template Renderer (designer.ts)

```typescript
import { SajuChart } from '@/lib/saju/types';

export interface DesignConfig {
    template: 'birth-chart' | 'element-card' | 'compatibility';
    chart: SajuChart;
    colorScheme?: 'dark' | 'light' | 'cosmic';
    userName?: string;
    locale?: string;
}

export async function renderPreview(config: DesignConfig): Promise<Buffer> {
    // Generate SVG using chart data
    // Element colors mapped from the Five Elements:
    const ELEMENT_COLORS = {
        Wood: { primary: '#4ade80', secondary: '#166534' },
        Fire: { primary: '#f87171', secondary: '#991b1b' },
        Earth: { primary: '#fbbf24', secondary: '#92400e' },
        Metal: { primary: '#e2e8f0', secondary: '#475569' },
        Water: { primary: '#60a5fa', secondary: '#1e3a5f' },
    };

    // Render SVG → PNG using sharp (already in Next.js)
    // Return PNG buffer for preview
    // ... template-specific rendering logic
}
```

### 5.5 Third-Party Integration

| Service | Purpose | Env Variable |
|---------|---------|-------------|
| Printful | Print-on-demand fulfillment | `PRINTFUL_API_KEY` |
| Gelato (fallback) | Alternative POD for Asia shipping | `GELATO_API_KEY` |
| Stripe Checkout | Payment for physical goods | `STRIPE_SECRET_KEY` (existing) |
| Sharp | SVG → PNG rendering | Built-in (Next.js dependency) |

---

## 6. Shared Infrastructure

### 6.1 New Environment Variables

```env
# Phase 6 — Push Notifications
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=

# Phase 6 — B2B API
# (uses existing STRIPE_SECRET_KEY)

# Phase 6 — Physical Goods
PRINTFUL_API_KEY=
GELATO_API_KEY=

# Phase 6 — Culture (no new vars — uses Vercel built-in geo)
```

### 6.2 Middleware Extension

The existing middleware at `src/middleware.ts` already guards all `/api/` routes. B2B routes need a **bypass** for API key auth (they don't use Supabase JWT):

```typescript
// Add to UNGUARDED_PATHS in existing middleware.ts:
const UNGUARDED_PATHS = [
    '/api/health',
    '/api/stripe/webhook',
    '/api/og',
    '/api/v1/b2b',           // ← NEW: B2B uses API key auth, not JWT
    '/api/merch/webhook',     // ← NEW: Printful webhook (verified by signature)
    '/api/feed/stream',       // ← NEW: Public SSE feed
];
```

### 6.3 Package Dependencies

```json
{
  "dependencies": {
    "onesignal-node": "^3.4.0",
    "sharp": "^0.33.0"
  }
}
```

> Note: `sharp` is already bundled with Next.js for image optimization. OneSignal is the only net-new dependency.

---

## 7. Database Migration Strategy

### 7.1 Migration Order

All migrations are **additive only** — no ALTER on existing tables, no DROP, no column renames.

```
supabase/migrations/
  20260224_push_subscriptions.sql      # Masterplan 1
  20260224_feed_events.sql             # Masterplan 2
  20260224_b2b_api_keys.sql            # Masterplan 3
  20260224_user_locale_preferences.sql # Masterplan 4
  20260224_merch_orders.sql            # Masterplan 5
```

### 7.2 New Tables Summary

| Table | Masterplan | RLS | Rows/Day (Est.) |
|-------|-----------|-----|-----------------|
| `push_subscriptions` | 1 - Push | ✅ | ~100 |
| `feed_events` | 2 - Feed | ✅ | ~50 |
| `feed_archetype_counts` | 2 - Feed | ✅ | ~10 |
| `b2b_api_keys` | 3 - B2B | ✅ | ~5 |
| `b2b_usage_log` | 3 - B2B | ✅ | ~10,000 |
| `user_locale_preferences` | 4 - Culture | ✅ | ~100 |
| `merch_products` | 5 - Merch | ✅ | ~0 (seeded) |
| `merch_orders` | 5 - Merch | ✅ | ~10 |

### 7.3 Existing Tables: ZERO Modifications

| Existing Table | Status |
|---------------|--------|
| `user_usage` | ❌ Not touched |
| `ai_cache` | ❌ Not touched |
| All auth.* tables | ❌ Not touched |

---

## 8. Execution Command

The following single command scaffolds all Phase 6 directories, files, and migration stubs. It creates only the skeleton — Claude Code then fills in the implementation based on the architecture above.

```bash
# ═══════════════════════════════════════════════════════════════
# OHANG Phase 6 — Scaffold Command
# Safe: mkdir -p is idempotent, touch won't overwrite existing files
# ═══════════════════════════════════════════════════════════════

mkdir -p src/lib/push && \
touch src/lib/push/{index,scheduler,templates,types}.ts && \
mkdir -p src/app/api/push/{subscribe,unsubscribe,trigger} && \
touch src/app/api/push/subscribe/route.ts && \
touch src/app/api/push/unsubscribe/route.ts && \
touch src/app/api/push/trigger/route.ts && \
mkdir -p supabase/functions/push-scheduler && \
touch supabase/functions/push-scheduler/index.ts && \
\
mkdir -p src/lib/feed/composers && \
touch src/lib/feed/{index,realtime,types}.ts && \
touch src/lib/feed/composers/{pillar-event,archetype-wave,element-shift}.ts && \
mkdir -p src/app/api/feed/{stream,history} && \
touch src/app/api/feed/stream/route.ts && \
touch src/app/api/feed/history/route.ts && \
mkdir -p "src/app/(main)/feed" && \
touch "src/app/(main)/feed/page.tsx" && \
touch "src/app/(main)/feed/FeedClient.tsx" && \
mkdir -p src/components/feed && \
touch src/components/feed/{FeedCard,FeedSkeleton,LiveIndicator}.tsx && \
\
mkdir -p src/lib/b2b && \
touch src/lib/b2b/{index,auth,billing,transform,types}.ts && \
mkdir -p src/app/api/v1/b2b/{analyze,chemistry,daily-pillar,face-reading} && \
touch src/app/api/v1/b2b/analyze/route.ts && \
touch src/app/api/v1/b2b/chemistry/route.ts && \
touch src/app/api/v1/b2b/daily-pillar/route.ts && \
touch src/app/api/v1/b2b/face-reading/route.ts && \
mkdir -p "src/app/api/v1/b2b-keys/[keyId]" && \
touch src/app/api/v1/b2b-keys/route.ts && \
touch "src/app/api/v1/b2b-keys/[keyId]/route.ts" && \
mkdir -p "src/app/(main)/developer" && \
touch "src/app/(main)/developer/page.tsx" && \
touch "src/app/(main)/developer/DeveloperClient.tsx" && \
\
mkdir -p src/lib/culture/mappings && \
touch src/lib/culture/{index,detector,types}.ts && \
touch src/lib/culture/mappings/{ko,ja,zh,en-us,pt-br,es,default}.ts && \
mkdir -p src/app/api/culture/{detect,preferences} && \
touch src/app/api/culture/detect/route.ts && \
touch src/app/api/culture/preferences/route.ts && \
\
mkdir -p src/lib/merch/templates && \
touch src/lib/merch/{index,designer,fulfillment,types}.ts && \
touch src/lib/merch/templates/{birth-chart,element-card,compatibility}.ts && \
mkdir -p src/app/api/merch/{preview,order,webhook,"status/[orderId]"} && \
touch src/app/api/merch/preview/route.ts && \
touch src/app/api/merch/order/route.ts && \
touch src/app/api/merch/webhook/route.ts && \
touch "src/app/api/merch/status/[orderId]/route.ts" && \
mkdir -p "src/app/(main)/shop" && \
touch "src/app/(main)/shop/page.tsx" && \
touch "src/app/(main)/shop/ShopClient.tsx" && \
mkdir -p "src/app/(main)/result/[id]/merch" && \
touch "src/app/(main)/result/[id]/merch/page.tsx" && \
mkdir -p src/components/merch && \
touch src/components/merch/{ProductPreview,OrderButton,FulfillmentTracker}.tsx && \
\
touch supabase/migrations/20260224_push_subscriptions.sql && \
touch supabase/migrations/20260224_feed_events.sql && \
touch supabase/migrations/20260224_b2b_api_keys.sql && \
touch supabase/migrations/20260224_user_locale_preferences.sql && \
touch supabase/migrations/20260224_merch_orders.sql && \
\
echo "✅ OHANG Phase 6 scaffold complete. 8 new tables, 5 masterplans, 0 existing files modified."
```

---

## Architecture Invariants (Non-Negotiable)

1. **`SajuEngine.compute()`** is NEVER modified. All new features consume its output.
2. **`OhangEngine`** is NEVER modified. Cultural layers are injected via context, not engine changes.
3. **Existing Supabase tables** (`user_usage`, `ai_cache`) receive ZERO schema changes.
4. **All new tables** have RLS enabled with `service_role` full access policies.
5. **All new API routes** use either JWT auth (consumer) or API key auth (B2B), never unauthenticated.
6. **`todayPillar.ts`** is consumed read-only by the push scheduler — never modified.
7. **Stripe integration** extends via new subscription items, not by modifying `stripe/index.ts`.

---

*Generated: 2026-02-23 | OHANG Phase 6 Masterplan v1.0.0*
