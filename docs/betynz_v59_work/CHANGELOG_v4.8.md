# Betynz v4.8 — Accounts and Monetization

## Added

- Adult-only free account preview with signup and sign-in interfaces.
- Free, Olympian Pro, Zeus Supreme and 24-hour Day Pass pricing.
- Monthly and annual billing presentation.
- Plan-based access gates for the Match Board, Olympian engines, Zeus, Bankers, Leonidas and Spartacus.
- Free/basic and premium/advanced match explanations.
- Saved Picks page and Pro access control.
- Notification preference page and browser-permission flow.
- Payment History page and hosted-checkout integration boundary.
- Responsible Play controls, 7-day device pause and viewing reminders.
- My Account, Plans, Saved Picks, Notifications, Billing, Responsible Play and Support pages in the hamburger drawer.
- Development preview activation for testing paid plans without collecting payment details.
- Public build pipeline now includes `monetization-config.js` in every GitHub Pages deployment.

## Security boundary

The deployed GitHub Pages package does not process passwords or card details. Real authentication, age verification, subscriptions, receipts and cancellation require a secure backend and hosted checkout provider.

## Preserved

- Existing prediction logic and v4.7 universal GG rule.
- Both Rebel engine rules and artwork.
- Smart Global Coverage and Deep Enrichment workflow.
- Live scoring, settlement, PWA updates and mobile/Fold navigation.
