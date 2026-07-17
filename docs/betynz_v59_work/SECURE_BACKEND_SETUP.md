# Betynz v5.0 Secure Backend Setup

This package supports:

- email + password registration
- email confirmation
- password reset
- Google sign-in
- server-side 18+ profile completion
- secure saved preferences and picks
- hosted Paystack checkout
- verified payment webhooks
- recurring monthly or annual access
- one-time 24-hour Day Pass
- cancellation of automatic renewal

The browser never receives the Supabase service-role key or Paystack secret key.

## Part A — Create the Supabase backend

1. Create a new Supabase project.
2. Save the project reference, project URL and public anon key.
3. Open **SQL Editor**.
4. Run these files in order:

```text
supabase/migrations/202607150001_secure_accounts.sql
supabase/migrations/202607150002_password_google_payments.sql
```

The second migration adds Google onboarding, password-compatible account logic, verified payment events and subscription cancellation fields.

## Part B — Enable email and password sign-in

In Supabase:

1. Open **Authentication → Providers → Email**.
2. Keep Email enabled.
3. Enable email/password sign-up.
4. Keep email confirmation enabled for production.
5. Set the minimum password length to at least 8 characters.
6. Customize the confirmation and password-recovery email templates with the Betynz name and domain.

Use these URL settings:

```text
Site URL: https://betynz.com
Redirect URL: https://betynz.com/**
```

## Part C — Enable Google sign-in

### 1. Create Google OAuth credentials

In Google Cloud Console:

1. Create or choose a Google Cloud project.
2. Configure the OAuth consent screen.
3. Add the Betynz name, support email and authorized domain.
4. Create an **OAuth Client ID** for a **Web application**.
5. Add this authorized redirect URI:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

6. Add these JavaScript origins:

```text
https://betynz.com
https://YOUR_PROJECT_REF.supabase.co
```

7. Copy the Google Client ID and Client Secret.

### 2. Connect Google to Supabase

In Supabase:

1. Open **Authentication → Providers → Google**.
2. Enable Google.
3. Paste the Google Client ID and Client Secret.
4. Save.

A Google user must complete the Betynz adult profile after the first sign-in. Until that is completed, paid checkout is blocked.

## Part D — Connect the website

Open `backend-config.js` and enter the public Supabase values:

```js
window.BETYNZ_BACKEND_CONFIG = Object.freeze({
  provider: "supabase",
  enabled: true,
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY",
  siteUrl: "https://betynz.com",
  authRedirectUrl: "https://betynz.com/#profile",
  functions: {
    checkout: "create-checkout-session",
    cancelSubscription: "cancel-subscription",
    deleteAccount: "delete-account"
  }
});
```

The anon key is intended for browser use. Never place these in GitHub Pages:

- Supabase service-role key
- Paystack secret key
- Google client secret

## Part E — Set up real subscription payments

Read `PAYSTACK_SUBSCRIPTION_SETUP.md` and complete every step. The secure money flow is:

```text
User selects a plan
→ authenticated Edge Function creates hosted checkout
→ Paystack collects payment
→ signed webhook verifies the payment
→ Supabase updates the subscription
→ Betynz reads the verified plan
→ payment provider settles funds to the connected bank account
```

A return to `betynz.com` does not unlock access by itself. Only the signed webhook can activate Pro, Supreme or Day Pass.

## Part F — Deploy the Supabase Edge Functions

Install and sign in to the Supabase CLI, then run:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-checkout-session
supabase functions deploy cancel-subscription
supabase functions deploy delete-account
supabase functions deploy paystack-webhook --no-verify-jwt
```

The webhook must allow requests without a Supabase user token because Paystack calls it directly. Security is provided by the Paystack HMAC signature check.

## Part G — Test before launch

Test in the payment provider's test mode first:

1. Create a password account.
2. Confirm the email.
3. Sign out and sign back in with the password.
4. Request a password reset and set a new password.
5. Sign in with Google using a second account.
6. Complete the 18+ profile.
7. Purchase each plan in test mode.
8. Confirm `billing_records` receives a paid record.
9. Confirm `subscriptions` receives the correct plan and expiry.
10. Confirm localStorage editing does not unlock paid access.
11. Cancel a recurring plan and confirm access remains until `current_period_end`.
12. Confirm another user cannot read that account's data.

After all tests pass, replace the test payment secret and plan codes with live values and repeat a small live transaction.

## Important limitation

The account and billing system is protected, but the current GitHub Pages `data.js` prediction payload is still public. Truly private premium predictions require moving the premium feed into Supabase or another authenticated API and removing it from the public repository build.

## Responsible platform controls

- Keep the 18+ restriction active.
- Do not advertise guaranteed outcomes.
- Keep responsible-play notices visible.
- Publish transparent historical results.
- Offer a clear cancellation and support route.
