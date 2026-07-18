# Betynz Real Product Architecture

## Public browser layer

The browser receives only:

- the responsive interface
- the Olympian engine descriptions
- generated match data
- generated decisions and reasons
- the locked public results record

API keys are never available in the browser.

## Private GitHub Actions layer

1. API-Football provides fixtures, standings, form, league history, odds and results.
2. TheStatsAPI optionally enriches xG and bookmaker snapshots.
3. The Olympian core evaluates fifteen specialist models.
4. Zeus rejects weak consensus and opposite markets.
5. Predictions lock inside 12 hours of kickoff.
6. Validation blocks malformed or unsafe snapshots.
7. Only the generated `dist/` folder is deployed.

## Olympian engine ownership

- Athena — team control and draw protection
- Apollo — league market history
- Ares — multi-signal mismatches
- Poseidon — scoring environment
- Hermes — odds confirmation
- Hera — consistency
- Artemis — half markets
- Hephaestus — opponent-adjusted context
- Demeter — form cycles
- Dionysus — streak confirmation
- Hades — calibrated value and traps
- Atlas — venue and recent strength
- Orion — trusted xG
- Nike — high-quality result markets
- Prometheus — foundation PPG model
- Zeus — final consensus and rejection core

## Release gates

- Data quality must reach 68/100 for Zeus.
- At least two specialists must agree.
- Weighted support must clear 1.75.
- Consensus lead must clear 0.35.
- Qualified opposite markets cause No Bet.
- A1 requires 88+, at least three specialist confirmations and a stronger lead.
- A2 requires 82+ and at least two confirmations.
