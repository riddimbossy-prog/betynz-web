# Future Monetization

Betynz v5.1 intentionally launches with free full access.

The existing Paystack/Supabase payment functions and plan definitions are retained but disabled by:

```js
freeLaunch: true
subscriptionsEnabled: false
```

When the platform is ready to monetize, complete a fresh security and pricing review, configure live payment secrets only in Supabase, deploy signed webhooks, and change the flags after end-to-end testing. Never place private payment keys in GitHub or browser code.
