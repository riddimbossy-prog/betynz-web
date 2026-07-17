# Betynz Core v6.0

A lightweight GitHub Pages football-analysis app with 16 Olympian engines, Spartacus, Leonidas, Zeus consensus, live scores, settlement and transparent match explanations.

## Public pages

- Dashboard
- Match Board
- Olympian and Rebel Engines
- Bankers
- Results
- Methodology
- Responsible Play

## Startup architecture

`nav-core.js` makes desktop, mobile, Z Fold and tablet navigation responsive immediately. `boot.js` loads the verified board and starts the full app. The service worker returns the last verified `data.js` quickly and refreshes it in the background.

## Workflows

- **Deploy Betynz Product** — code deployment and self-healing live-board check
- **Smart Global Coverage and Deep Enrichment** — fixtures, evidence, odds and predictions
- **Refresh Live & Finished Scores and Deploy** — scores and settlement
- **Refresh Priority Evidence** — xG and Rebel odds refresh

Never place API keys in public files. Keep keys in GitHub Actions secrets.
