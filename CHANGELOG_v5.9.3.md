# Betynz v5.9.3 — Instant Data Boot

- Returns the last verified board from the PWA cache immediately.
- Refreshes `data.js` in the background instead of blocking every launch.
- Limits a first-install network wait to 4.5 seconds, then reloads once when verified data arrives.
- Rejects cached packaged demo fixtures.
- Loads the Supabase SDK asynchronously so account services cannot delay fixtures.
- Renders the dashboard first and defers hidden pages until idle or opened.
- Defers community, performance and health work until their pages are opened.
- Preserves all v5.9.2 live-data recovery and prediction rules.
- Adds a 4.5-second first-visit boot timeout so a slow `data.js` request cannot hold the entire interface hostage.
