# Betynz v2.3 — Today All-Leagues Fast Deploy

## Fixed

- GitHub Pages now deploys directly from the generated artifact before any Git commit is attempted.
- A repository archive failure can no longer block the live website.
- Tracked `scripts/config.txt` files are restored before commit/rebase operations.
- Data pushes retry safely without leaving a dirty worktree.

## Faster global coverage

- Today-only fixture discovery uses one API-Football `/fixtures?date=...` request.
- The fetch no longer probes three seasons for each date.
- `MAX_LEAGUES=0` removes the previous 45-league cap.
- Fast mode skips H2H, full league-history and four-per-team deep calls.
- Standings use the season supplied by each fixture.
- HTTP keep-alive, timeouts and retry/backoff are enabled.
- Live score refreshes deploy directly every 15 minutes.

## Important

“Every league” means every competition returned by API-Football for the account and plan. Leagues or endpoints not covered by the subscription cannot be retrieved by the workflow.
