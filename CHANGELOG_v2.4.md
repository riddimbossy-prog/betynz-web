# Betynz v2.4 — Adaptive Enrichment

## Objective

Show every API-Football fixture scheduled today while concentrating expensive evidence calls on the matches most likely to become valid Zeus selections.

## New data cascade

1. Global coverage: one fixtures discovery request for today, then standings and available odds by league.
2. Adaptive planner: scores every upcoming fixture using data quality, odds depth, PPG/venue separation, goal-environment clarity and kickoff proximity.
3. Deep pass: re-fetches only the highest-priority league groups with team statistics, recent-ten histories, league trends and H2H enabled.
4. Merge: overlays deep evidence on the complete global board, so no leagues disappear.
5. TheStatsAPI pass: xG, odds movement and near-kickoff lineups are limited to the highest-priority fixtures.
6. Zeus evidence gate: A1/A2 selections require independent deep-evidence pillars. Coverage-only matches remain visible but cannot be promoted as public bankers.

## Default limits

- Deep leagues: 18
- Deep fixtures: 48
- TheStatsAPI priority fixtures: 24

These can be changed under GitHub repository **Settings → Secrets and variables → Actions → Variables** using:

- `DEEP_MAX_LEAGUES`
- `DEEP_MAX_MATCHES`
- `TSA_MAX_MATCHES`

## Speed and quota controls

- Every league is discovered in the fast first pass.
- Expensive calls are no longer spent equally on weak or data-poor fixtures.
- TheStatsAPI team xG form is cached for 12 hours.
- Lineup calls run only from 150 minutes before kickoff through 30 minutes after kickoff.
- Priority xG/lineup evidence refreshes hourly without repeating the full API-Football crawl.
