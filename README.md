# Betynz.com Production Build v1

**Tagline:** Smart Betting Predictions

This repository is ready for GitHub Pages and the custom domain `betynz.com`.

## What is included

- New black-and-orange Betynz dashboard for desktop, tablets, phones and foldables
- 16 Olympian prediction identities
- Responsive full match board, banker board, results page and engine directory
- Local slip builder with combined odds and copy support
- PWA manifest, install icons, service worker, `CNAME` and GitHub Pages deployment
- API-Football fixture, standings, form, odds and live-score jobs
- TheStatsAPI enrichment pass using the existing `STATS_API_KEY` secret
- Demo data so the interface is populated before the first successful API run

## Install in the existing `betynz-web` repository

1. Download and extract the ZIP.
2. Open the extracted `Betynz_Production_v1` folder.
3. Upload **all files and folders inside it** to the root of the GitHub repository.
4. When GitHub asks about conflicts, replace the old starter files.
5. Commit directly to `main` with the message:

   `Install Betynz production build v1`

6. Open **Actions** and wait for **Deploy Betynz to GitHub Pages** to turn green.
7. Run **Update Betynz Data** manually once.

## Required repository secrets

These names match the current setup:

- `API_FOOTBALL_KEY`
- `STATS_API_KEY`
- `DAYS_BACK` — value only, recommended `1`
- `DAYS_FWD` — value only, recommended `6`

Do not put API keys in `data.js`, `app.js`, `config.txt`, screenshots or commits.

## Required GitHub permission

Go to:

`Settings → Actions → General → Workflow permissions`

Choose **Read and write permissions** and save. The data jobs need permission to commit generated `data.js` updates.

## Workflows

### Deploy Betynz to GitHub Pages

Runs after every push to `main`. It publishes the repository to GitHub Pages.

### Update Betynz Data

Runs every six hours and can also be started manually. It:

1. Creates a temporary private config from GitHub Secrets
2. Pulls fixtures and football statistics from API-Football
3. Optionally enriches matching fixtures through TheStatsAPI
4. Replaces the demo `data.js` with the live snapshot
5. Commits the generated data back to the repository

### Update Betynz Live Scores

Runs every 15 minutes to refresh scores and match status. Increase the interval if the API plan has a small daily request allowance.

## Important engine note

The website uses the mature 16-engine suite from the uploaded Betynz package and presents the systems under Betynz Olympian identities. The uploaded four-engine specification is also kept in `docs/` as an architecture reference. The live selection list is conservative: engines may return **No Bet**, and no match is forced onto the board.

## First launch behavior

Before the first successful data workflow, the site shows demonstration fixtures and clearly labels the source as **Demo Data**. After `Update Betynz Data` completes, the workflow removes the demo marker and the header changes to **Live Data**.
