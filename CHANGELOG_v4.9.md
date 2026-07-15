# Betynz v4.9 — Secure Accounts Backend

- Added Supabase passwordless email authentication with PKCE session handling.
- Added server-side adult age enforcement and accepted-terms timestamps.
- Added Postgres tables for profiles, preferences, saved picks, subscriptions, receipts and audit events.
- Enabled row-level security so signed-in users can access only their own records.
- Removed browser authority over paid plan assignment in production mode.
- Added server-derived plan entitlements and expiry dates.
- Added secure synchronization for board preferences, notification preferences and saved picks.
- Added server-side seven-day access pause.
- Added authenticated Edge Function templates for checkout, account portal and account deletion.
- Preserved the current prediction rules, engines, live scores, settlement and responsive UI.

## Important

The Supabase project URL and anon key are public client identifiers and belong in `backend-config.js`. The service-role key, payment secrets and webhook secrets must remain in Supabase function secrets and must never be added to this repository.
