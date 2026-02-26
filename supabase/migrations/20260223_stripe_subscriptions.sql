-- ═══════════════════════════════════════════════════════
-- OHANG — Stripe Subscription & IAP Tables
-- Supports: tier upgrade via webhook, IAP feature grants
-- ═══════════════════════════════════════════════════════

-- User subscription tier (upserted by webhook)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    user_id                 TEXT PRIMARY KEY,
    subscription_tier       TEXT NOT NULL DEFAULT 'free'
                            CHECK (subscription_tier IN ('free', 'basic', 'pro', 'destiny')),
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subs_tier
    ON user_subscriptions (subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_subs_stripe_sub
    ON user_subscriptions (stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_subs_full"
    ON user_subscriptions FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "user_read_own_sub"
    ON user_subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::TEXT);

-- IAP purchases (one-time feature unlocks)
CREATE TABLE IF NOT EXISTS user_iap_purchases (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         TEXT NOT NULL,
    feature         TEXT NOT NULL CHECK (feature IN (
        'basic', 'red_flag', 'couple_scan', 'retro_mode', 'celeb_match'
    )),
    stripe_payment_id TEXT,
    purchased_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iap_user_feature
    ON user_iap_purchases (user_id, feature);

ALTER TABLE user_iap_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_iap_full"
    ON user_iap_purchases FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "user_read_own_iap"
    ON user_iap_purchases FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::TEXT);
