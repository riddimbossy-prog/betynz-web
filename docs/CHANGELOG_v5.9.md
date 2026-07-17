# Betynz v5.9 — Permanent Game Population Fix

## Fixed

- UI-only deployments can no longer overwrite a healthy live `data.js` with the packaged empty bootstrap.
- The static Pages workflow restores the newest non-empty verified board from Git history before building.
- Static deployment is blocked when no verified board exists instead of publishing an empty website.
- Main data, live-score and priority-enrichment workflows recover the last verified board before processing.
- A zero-fixture API response retains the previous verified board instead of erasing every game.
- The service worker keeps a canonical last-known live board and refuses to replace it with an accidental empty `data.js`.
- Stale retained data is clearly identified while the next successful refresh is running.

## Unchanged

Prediction rules, account access, community features, Rebel logic and settlement rules are unchanged.
