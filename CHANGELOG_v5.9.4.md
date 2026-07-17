# Betynz v5.9.4 — Self-Healing Live Deployment

- Deploy Betynz Product now checks for a verified live board first.
- When no verified board exists, it automatically runs Smart Global Coverage and Deep Enrichment.
- The data refresh workflow can start safely even when data.js is missing or contains only packaged demo fixtures.
- A clean temporary refresh board replaces demo data before API fetching.
- The refresh must produce a verified non-empty board before Pages deployment continues.
- Code-only deployment still uses the last verified board when one is available.
- No API keys are written to public files.
