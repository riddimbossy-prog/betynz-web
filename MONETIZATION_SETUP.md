# Betynz Accounts and Monetization

Betynz v4.9 replaces device-only account authority with a secure Supabase backend connection.

Read `SECURE_BACKEND_SETUP.md` and run the SQL migration in `supabase/migrations/202607150001_secure_accounts.sql`.

Paid access must be written to `subscriptions` only by a verified payment webhook using a server-side service role. Browser localStorage, checkout return URLs and client-side JavaScript must never assign Pro, Supreme or Day Pass access.

The frontend does not collect card details. Checkout and account-portal actions are routed through authenticated Edge Functions.
