# Betynz v6.2.0 Test Plan

## Database and API flow
- Dashboard loads fixtures from `/api/dashboard/today` without a static `data.js` dependency.
- Published predictions map to qualified match cards.
- Fixtures without published predictions remain visible as `Analysing`, `No Banker`, or `Data Pending`.
- Null prediction records do not crash fixture normalization.
- Date changes request the selected database day.
- Cached data renders during a temporary network outage and is clearly marked stale.
- The board refreshes every five minutes, when the tab becomes visible, and when the browser reconnects.
- `Live Data` appears only after a valid database response.

## Backend synchronization
- `refresh-board` imports/updates fixtures, refreshes profiles, generates predictions, and settles completed matches.
- Daily coverage imports today plus the next six days.
- Repeated syncs are idempotent and do not duplicate fixtures or predictions.
- Admin sync routes reject missing or invalid `x-admin-secret` values.
- CORS permits Betynz production origins and rejects unrelated browser origins.
- Missing provider data produces a pending state instead of a fabricated prediction.

## Database security
- Supabase service-role credentials remain server-side.
- Anonymous and authenticated clients cannot write directly to football tables.
- Primary keys, unique fixture IDs, foreign keys, and performance indexes are present.
- Predictions lock before kickoff and settled records remain auditable.

## Engine regression
- Rebel and Olympian rule suites pass at all threshold boundaries.
- Conflict and consensus gates preserve one final published market per fixture.
- An engine failure does not publish an unsafe fallback.
- Fixtures that fail every quality gate remain visible as `No Banker`.

## PWA and startup
- App shell opens without waiting for the database request.
- Service worker caches only lightweight shell assets and never reads the full fixture dataset as text.
- First-user walkthrough and install experience assets are included in the production build.
- Offline startup uses the latest valid cached board when available.
- No automatic reload loop occurs during service-worker activation.

## UI regression
- 360px Android width.
- iPhone width.
- Samsung Z Fold cover display.
- Samsung Z Fold unfolded display.
- Tablet portrait and landscape.
- Desktop widths from 1280px upward.
- No horizontal overflow.
- Sidebar remains scrollable and footer text wraps.
- Loading, empty, error, analysing, no-banker, live, and finished states are readable.
- Date and market filters remain usable.
- Empty Analysis List collapses and expands after a selection.
- Empty performance cards remain hidden until meaningful data exists.

## Release gates
- `npm run check` passes.
- `npm run build` succeeds.
- `dist/` contains every referenced local asset.
- No production file exceeds 5 MB.
- No `data.js`, API key, service-role key, JWT, or BetsPapa branding is included.
- Only the unified Pages deployment workflow can publish the site.
