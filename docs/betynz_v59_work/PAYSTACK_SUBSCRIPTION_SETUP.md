# Betynz Paystack Subscription Setup — Step by Step

This guide explains how subscription revenue moves from the customer to your payment-provider balance and then to your settlement bank account.

Because payment-provider eligibility, currencies, fees and settlement rules can change, confirm the current requirements shown inside your own Paystack dashboard before going live.

## 1. Open and verify the payment account

1. Create a Paystack business account.
2. Complete the requested identity or business verification.
3. Add the business name and Betynz website.
4. Add the bank account that should receive settlements.
5. Complete any compliance or product-review questions.
6. Keep the account in test mode until the full flow works.

The payment provider—not GitHub Pages—collects the card or supported payment details.

## 2. Choose your public prices

Open `monetization-config.js` and choose the currency and display prices customers will see.

Example structure:

```js
currency: "GHS"
```

Keep the frontend prices identical to the server-side Paystack amounts. Do not show USD in the interface while charging GHS unless the checkout clearly explains the conversion.

## 3. Create four recurring plans

In Paystack, create these plans:

```text
Olympian Pro Monthly
Olympian Pro Annual
Zeus Supreme Monthly
Zeus Supreme Annual
```

Copy each plan code and map it to:

```text
PAYSTACK_PLAN_PRO_MONTHLY
PAYSTACK_PLAN_PRO_ANNUAL
PAYSTACK_PLAN_SUPREME_MONTHLY
PAYSTACK_PLAN_SUPREME_ANNUAL
```

The Day Pass is a one-time payment and does not need a recurring plan code.

## 4. Convert prices to minor units

The checkout function expects provider amounts in the currency's minor unit.

Example only:

```text
100.00 → 10000 minor units
29.99 → 2999 minor units
```

Set these values:

```text
PAYSTACK_AMOUNT_PRO_MONTHLY
PAYSTACK_AMOUNT_PRO_ANNUAL
PAYSTACK_AMOUNT_SUPREME_MONTHLY
PAYSTACK_AMOUNT_SUPREME_ANNUAL
PAYSTACK_AMOUNT_DAY
```

Confirm the correct minor-unit rule for the currency selected in your Paystack account.

## 5. Add secure Supabase secrets

Run commands like these from the project directory:

```bash
supabase secrets set BETYNZ_SITE_URL=https://betynz.com
supabase secrets set PAYSTACK_SECRET_KEY=YOUR_TEST_SECRET_KEY
supabase secrets set PAYSTACK_CURRENCY=GHS
supabase secrets set PAYSTACK_AMOUNT_PRO_MONTHLY=YOUR_AMOUNT
supabase secrets set PAYSTACK_AMOUNT_PRO_ANNUAL=YOUR_AMOUNT
supabase secrets set PAYSTACK_AMOUNT_SUPREME_MONTHLY=YOUR_AMOUNT
supabase secrets set PAYSTACK_AMOUNT_SUPREME_ANNUAL=YOUR_AMOUNT
supabase secrets set PAYSTACK_AMOUNT_DAY=YOUR_AMOUNT
supabase secrets set PAYSTACK_PLAN_PRO_MONTHLY=YOUR_PLAN_CODE
supabase secrets set PAYSTACK_PLAN_PRO_ANNUAL=YOUR_PLAN_CODE
supabase secrets set PAYSTACK_PLAN_SUPREME_MONTHLY=YOUR_PLAN_CODE
supabase secrets set PAYSTACK_PLAN_SUPREME_ANNUAL=YOUR_PLAN_CODE
```

Never add the secret key to:

- `backend-config.js`
- `monetization-config.js`
- GitHub repository secrets used by public frontend builds
- browser localStorage

## 6. Deploy payment functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy cancel-subscription
supabase functions deploy paystack-webhook --no-verify-jwt
```

## 7. Add the webhook URL

In the Paystack dashboard, add:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

The webhook verifies the `x-paystack-signature` before changing access.

## 8. What the webhook does

On a verified successful charge it:

1. identifies the authenticated Betynz user from secure checkout metadata;
2. records the paid amount and currency;
3. activates Pro, Supreme or Day Pass;
4. calculates the verified access period;
5. stores the provider customer and subscription codes;
6. adds an audit record;
7. prevents the same event from being processed twice.

On a failed renewal it can mark the plan past due. On cancellation it stops automatic renewal while preserving already-paid access until the period ends.

## 9. Test the full money path

Use test mode:

1. Sign in to Betynz.
2. Open Pricing.
3. Choose a plan.
4. Complete test checkout.
5. Wait for the webhook.
6. Open Supabase Table Editor.
7. Confirm a row appears in `billing_records`.
8. Confirm a row appears in `subscriptions`.
9. Return to My Account and confirm the plan changes.
10. Test cancellation.

Do not treat the checkout success page as proof of payment. The subscription should change only after the signed webhook arrives.

## 10. Go live and receive real settlement

1. Finish payment-account verification.
2. Confirm the settlement bank account.
3. Replace the test secret key with the live secret key in Supabase secrets.
4. Replace test plan codes with live plan codes.
5. Confirm the live webhook URL.
6. Make one small live purchase using a separate customer account.
7. Confirm the payment appears in Paystack, `billing_records`, and `subscriptions`.
8. Confirm the provider marks the payment for settlement to the connected bank account.

Settlement timing, fees, reserves and supported payout currencies are controlled by the payment provider and your verified account configuration.

## 11. Revenue records

For each verified payment, Betynz stores:

- user ID
- provider reference
- plan
- amount
- currency
- paid status
- billing description
- payment date

Use the payment provider's reports as the financial source of truth. Betynz billing records are for account access and customer history, not formal accounting.

## 12. Launch checklist

```text
[ ] Supabase migrations installed
[ ] Email/password sign-in tested
[ ] Google sign-in tested
[ ] 18+ profile completion tested
[ ] Payment account verified
[ ] Settlement bank account connected
[ ] Four recurring plan codes created
[ ] Five amounts added as Supabase secrets
[ ] Checkout function deployed
[ ] Webhook deployed without JWT verification
[ ] Webhook URL added to Paystack
[ ] Test payments activate correct plans
[ ] Cancellation preserves paid access until expiry
[ ] Live secret and live plan codes installed
[ ] Small live transaction completed
[ ] Support and refund policy published
```
