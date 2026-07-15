# Betynz v5.0

## Authentication

- Added email and password registration.
- Added password sign-in.
- Added email confirmation support.
- Added password reset and new-password flow.
- Added Sign in with Google.
- Added mandatory 18+ profile completion after first Google sign-in.

## Payments

- Replaced static checkout links with authenticated Paystack transaction initialization.
- Added signed Paystack webhook verification.
- Added monthly, annual and one-time Day Pass processing.
- Added idempotent payment-event records.
- Added verified billing history and subscription activation.
- Added recurring subscription cancellation while preserving paid access until expiry.

## Security

- Private payment and service-role keys stay in Supabase secrets.
- Checkout uses fixed server-side plan and amount mappings.
- Paid access cannot be granted by a browser return URL.
- Google users cannot reach checkout before completing adult eligibility.
