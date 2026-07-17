# Betynz.com — Real Product v3.9

**Tagline:** Smart Betting Predictions

This is the deployable Betynz core product for GitHub Pages. It uses GitHub Actions as the private data-processing layer and publishes only generated public football data.

## What is real in v2.0

- API-Football fixture, standings, team statistics, odds and score pipeline
- Optional TheStatsAPI xG and multi-book odds enrichment
- Six-day forward board plus one-day score lookback
- Fifteen independently implemented Olympian specialist engines
- Leonidas and Spartacus Rebel odds-movement engines
- Zeus consensus, contradiction and data-quality gate
- Pre-kickoff prediction locking for record integrity
- Public results history based only on locked predictions
- A1, A2, Watchlist and No Bet outcomes
- Responsive black/orange dashboard, engine directory, banker board, results, methodology and data-status views
- Local selection list and preferences
- PWA support
- GitHub Pages release built from a safe `dist/` folder

## Account and payment boundary

Version 4.8 includes a complete account, pricing and plan-access preview in the public interface. Preview accounts and test plan activations are stored only in the current browser so the owner can test the experience. They are not production authentication or proof of payment.

Passwords and card details are never collected by this static GitHub Pages package. Production authentication, age verification, paid entitlements, receipts, cancellations and refunds must be confirmed by a secure backend and hosted checkout provider.

## Required GitHub repository secrets

- `API_FOOTBALL_KEY`
- `STATS_API_KEY`
- `ODDS_API_KEY`
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

Runs every six hours. It creates a temporary config from GitHub Secrets, fetches and enriches data, evaluates all Olympian and Rebel engines, applies Zeus, locks eligible predictions, validates the snapshot and commits generated public data.

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

## v3.9 Rebel engines

- **Spartacus** scans broader multi-book movement using a minimum of three timestamped bookmakers and 55% directional agreement.
- **Leonidas** is stricter, requiring at least five timestamped bookmakers, 70% agreement and two related confirmations.
- Both engines use the uploaded v1.1 goal-market and favourite downgrade rules.
- Missing opening prices, weak agreement or contradictory movement produces No Bet.
- Rebel engines can support or challenge Zeus, but cannot create a public decision without Olympian confirmation.

Run `npm run test:rebels` to verify the uploaded v1.1 rule examples.

## v4.8 accounts and monetization

- Free account: three public daily picks, live scores, settled results and basic explanations.
- Olympian Pro: $8.99 monthly or $79 annually.
- Zeus Supreme: $17.99 monthly or $159 annually.
- Day Pass: $2.99 for 24 hours without renewal.
- Premium gates cover the full seven-day board, saved picks, alerts, Olympian engines, Zeus, Bankers, Leonidas and Spartacus.
- The drawer includes My Account, Plans, Saved Picks, Notifications, Payment History, Responsible Play, Support and Sign Out.
- `monetization-config.js` contains public plan settings and hosted-checkout URLs only. Never place private payment or webhook keys there.

See `MONETIZATION_SETUP.md` before connecting a production authentication or payment provider.

## v4.9 secure backend

The account interface can now use Supabase passwordless authentication, Postgres Row Level Security, server-derived plan entitlements, cloud preferences, saved picks, receipts and account-pause controls. Follow `SECURE_BACKEND_SETUP.md` before enabling production access.


## v5.6 PPG and defence decision rules

Straight wins now require a full 2.00+ versus sub-1.00 overall-and-split PPG mismatch plus a medium/leaky opponent defence. Other straight-win signals are protected by DNB. Automatic GG requires both teams at 1.50+ overall and split PPG, a 2.80+ GPG league, draw odds of at least 3.70 and two medium/leaky venue defences. Low-PPG teams in medium/low leagues route to Under 2.5 or Under 3.5 according to defensive leakiness, with draw odds capped at 3.00.
