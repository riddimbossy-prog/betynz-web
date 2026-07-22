# Betynz v6.2.0 — Live Database Board

Betynz v6.2.0 replaces the former giant browser-side `data.js` bundle with a database-first dashboard.

## What this release does

- Automatically imports fixtures into Supabase through the protected Betynz API.
- Displays every database fixture, even when a prediction is still being analysed.
- Shows clear states: **Qualified**, **Analysing**, **No Banker**, **Data Pending**, **Live**, and **FT**.
- Refreshes the public board every five minutes without reloading the page.
- Loads today plus the next six days on demand.
- Uses a small cached database response as the offline fallback.
- Automatically refreshes today’s fixtures every 30 minutes with GitHub Actions.
- Automatically fills seven-day fixture coverage once daily.
- Grades completed predictions and updates the verified results record.
- Uses one GitHub Pages deployment workflow.
- Keeps the public frontend free of login and subscription controls.

## Repository layout

- `dist/` — generated GitHub Pages release after `npm run build`
- `server/` — Render/Node API
- `supabase/migrations/202607180001_betynz_core.sql` — required football database schema
- `.github/workflows/deploy-pages.yml` — validated website deployment
- `.github/workflows/database-refresh.yml` — today-board refresh every 30 minutes
- `.github/workflows/database-coverage.yml` — today plus six future days
- `runtime-config.js` — public API base URLs and browser refresh interval

## Required production configuration

### Supabase

Run `supabase/migrations/202607180001_betynz_core.sql` in the Supabase SQL editor.

### Render environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_FOOTBALL_KEY`
- `ADMIN_SYNC_SECRET`
- `ALLOWED_ORIGINS=https://betynz.com,https://www.betynz.com,https://riddimbossy-prog.github.io`

`ODDS_API_KEY` is optional in this release. The current database sync and prediction pipeline runs from API-Football data.

### GitHub repository secrets

- `ADMIN_SYNC_SECRET` — must exactly match Render
- `BETYNZ_API_BASE_URL` — optional; defaults to `https://betynz-api.onrender.com`

## Local checks

```bash
npm run check
npm run build
```

The checks cover JavaScript syntax, database response mapping, release validation, and all backend engine tests.

## Public API endpoints

- `GET /api/health`
- `GET /api/dashboard/today?date=YYYY-MM-DD`
- `GET /api/fixtures/today?date=YYYY-MM-DD`
- `GET /api/predictions/today?date=YYYY-MM-DD`
- `GET /api/results/recent`

Protected scheduler endpoints:

- `POST /api/admin/refresh-board`
- `POST /api/admin/run-daily`

The browser never receives the Supabase service-role key or the football-provider key.
