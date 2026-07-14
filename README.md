# Betynz.com — Real Product v2.0

**Tagline:** Smart Betting Predictions

This is the deployable Betynz core product for GitHub Pages. It uses GitHub Actions as the private data-processing layer and publishes only generated public football data.

## What is real in v2.0

- API-Football fixture, standings, team statistics, odds and score pipeline
- Optional TheStatsAPI xG and multi-book odds enrichment
- Six-day forward board plus one-day score lookback
- Fifteen independently implemented Olympian specialist engines
- Zeus consensus, contradiction and data-quality gate
- Pre-kickoff prediction locking for record integrity
- Public results history based only on locked predictions
- A1, A2, Watchlist and No Bet outcomes
- Responsive black/orange dashboard, engine directory, banker board, results, methodology and data-status views
- Local selection list and preferences
- PWA support
- GitHub Pages release built from a safe `dist/` folder

## What is intentionally not faked

There is no real user authentication, payment, premium subscription, community posting or bookmaker integration in this build. Those features require a private backend and should not be simulated in production.

## Required GitHub repository secrets

- `API_FOOTBALL_KEY`
- `STATS_API_KEY`
- `DAYS_BACK` — recommended value `1`
- `DAYS_FWD` — recommended value `6`

Never commit API keys to this repository.

## GitHub permission

Open:

`Settings → Actions → General → Workflow permissions`

Select **Read and write permissions**.

## First live run

1. Upload all files in this folder to the root of `betynz-web`.
2. Commit to `main`.
3. Wait for **Deploy Betynz Product** to succeed.
4. Open **Actions → Update Betynz Product Data → Run workflow**.
5. When that workflow succeeds, it replaces the demo snapshot with real API data.

## Product workflows

### Deploy Betynz Product

Validates the code, builds a public `dist/` folder, and deploys only safe public assets to GitHub Pages. Source scripts, private runtime files and internal model ledgers are not published.

### Update Betynz Product Data

Runs every six hours. It creates a temporary config from GitHub Secrets, fetches and enriches data, evaluates all Olympian engines, applies Zeus, locks eligible predictions, validates the snapshot and commits generated public data.

### Update Betynz Live Scores

Runs every 15 minutes. It refreshes match status and scores, settles locked predictions, updates the verified record and republishes the data snapshot.

## Prediction integrity

Predictions more than 12 hours from kickoff are provisional. Inside the 12-hour window, an eligible Zeus decision is locked. Only a decision that was locked before kickoff can enter `results-history.json`.

Model scores are internal evidence scores, not guarantees or certified probabilities.

## Local checks

```bash
npm run snapshot
npm run check
npm run build
npm run serve
```

Open `http://localhost:8080`.

## v2.4 adaptive enrichment

The live data workflow now uses a two-pass model. Pass one discovers every competition returned for today. Pass two ranks fixtures and spends deeper API calls only where they can materially improve a Zeus decision. The complete board remains visible, but A1/A2 public selections require independent deep evidence.

Run **Smart Global Coverage and Deep Enrichment** from GitHub Actions after installing the package. The hourly **Refresh Priority Evidence** workflow updates xG, odds movement and near-kickoff lineups for the current shortlist.
