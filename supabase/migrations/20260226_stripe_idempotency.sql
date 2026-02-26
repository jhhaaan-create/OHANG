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
