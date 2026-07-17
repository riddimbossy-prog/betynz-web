# Betynz v4.1 — Rebel Odds Activation

- Fixed Leonidas and Spartacus returning zero signals because per-bookmaker prices were discarded.
- Preserves current odds from every API-Football bookmaker instead of only one book.
- Added persistent first-observed and latest price history in `scripts/rebel-odds-history.json`.
- Added hourly fixture-level odds refresh for priority matches.
- Keeps genuine TheStatsAPI opening/current pairs when available and merges them with API-Football history.
- Added Rebel coverage diagnostics: collecting, Spartacus-ready, Leonidas-ready and active movement.
- Added related-line and draw-drift confirmations without lowering the 3-book/5-book thresholds.
- Wired `ODDS_API_KEY` through the workflows for future provider adapters; this build does not expose any secret publicly.
