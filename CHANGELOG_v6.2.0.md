# Betynz v6.2.0

## Live database board

- Replaced the 99.7 MB startup dataset with `/api/dashboard/today`.
- Added automatic fixture rows for games without published predictions.
- Added five-minute foreground refresh, tab-return refresh and reconnect refresh.
- Added local cached-response fallback and clear loading/error states.
- Added today-plus-six-days database coverage.

## Deployment and PWA

- Unified GitHub Pages deployment into one validated workflow.
- Added scheduled protected database refresh workflows.
- Rebuilt the service worker around the small application shell.
- Included `experience.js` in the release build.
- Unified all frontend release references at v6.2.0.

## Backend and database

- Rebranded the API for Betynz.
- Added Betynz CORS origins.
- Added `/api/admin/refresh-board`.
- Added the complete Supabase football schema, indexes, constraints and RLS.
- Fixed team-targeted profile hydration.
- Added public dashboard compatibility with automatic grading and processing status.

## Interface

- Removed visible sign-in and free-preview controls.
- Added live fixture count, qualified count and last-update summary.
- Reduced hero height.
- Collapsed empty selection panels.
- Hid empty results/streak panels.
- Fixed sidebar scrolling and footer wrapping.
- Added database states instead of blank match-board space.
