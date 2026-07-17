# Betynz v5.9.1 — Navigation Freeze Repair

- Removed a self-triggering full-page MutationObserver loop from community engine-card decoration.
- Scoped engine-card observation to direct changes inside the engine grid.
- Follow buttons now update only when their state or label actually changes.
- Follow-button taps no longer accidentally open the engine page.
- Refreshed all browser asset keys so old cached v5.8/v5.9 scripts cannot remain mixed with the repaired build.
- Added a one-reload guard to PWA service-worker activation.
- Preserved v5.9 live-board recovery and all prediction rules.
