# Betynz Account and Monetization Setup

Version 4.8 includes the complete client-side account and plan interface. It deliberately does not store passwords or card details.

## Plans

- Free: 3 public daily picks, live scores, settled results and basic explanations.
- Olympian Pro: $8.99 monthly or $79 annually.
- Zeus Supreme: $17.99 monthly or $159 annually.
- Day Pass: $2.99 for 24 hours without renewal.

## Preview mode

`monetization-config.js` starts with:

```js
mode: "preview"
```

This allows the site owner to create a local test account and activate a test paid plan on one device. It is not real authentication or payment.

## Production connection

1. Connect a secure authentication provider or server.
2. Verify email and date of birth server-side.
3. Create hosted checkout products with an approved payment provider.
4. Put only public hosted-checkout URLs in `checkoutUrls` inside `monetization-config.js`.
5. Change `mode` to `production`.
6. Confirm paid access from signed server records, not from browser localStorage.
7. Connect a customer portal for cancellation and receipts.
8. Add verified Terms, Privacy, Refund and Responsible Play pages.

## Important

Never put payment-provider secret keys, API private keys or webhook secrets in this repository. GitHub Pages files are public.
