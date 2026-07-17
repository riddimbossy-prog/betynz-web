# Betynz Core v6.0

## Reliability reset

- Removed the Zeus web splash overlay and first-run tour.
- Removed Community, account, payment, notification and Supabase code from page startup.
- Reduced public navigation to Dashboard, Match Board, Engines, Bankers, Results, Methodology and Responsible Play.
- Added a tiny navigation core that works before fixture data finishes loading.
- Fixed the root tab failure: settled-result data used the variable name `history`, which shadowed `window.history` and caused every route change to throw.
- Replaced all route writes with `window.history`.
- Simplified the PWA service worker and removed update/reload loops.
- Kept the installed bold-B icon while removing the custom Zeus launch overlay.
- Preserved Olympian engines, Spartacus, Leonidas, live scores, settlement, match explanations, local selection lists and all data workflows.
- Demo-data protection and self-healing live-data deployment remain active.
