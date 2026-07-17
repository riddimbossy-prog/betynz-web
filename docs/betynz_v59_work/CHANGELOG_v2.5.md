# Betynz v2.5 — Seed Purge and Live Data Integrity

## Fixed

- Removes the packaged 20-fixture demo board permanently.
- Blocks fixture IDs 900001–900020 and any row containing `demoPredictions` from live output.
- Cleans old demo rows during global fetch, deep-enrichment merge and Olympian snapshot generation.
- Cleans stale demo selection-list items from browser local storage.
- Prevents a `Live Data` badge from appearing while the product is still waiting for its first verified sync.
- Removes `data.js` from the service-worker pre-cache and forces a cache rollover.
- Rejects any future deployment that still contains packaged demo rows.

## Data states

- `Sync Pending`: no verified API run has been published yet.
- `Live Data`: verified API data is present.
- `Live · No Fixtures`: the API was checked successfully but returned no fixtures for the selected day.
- `Stale Data`: the last verified snapshot is older than the freshness limit.

## Important

A green workflow now means both the workflow and the public-data integrity check passed. The public build fails if any original demo fixture remains.
