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
