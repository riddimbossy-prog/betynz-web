# Betynz v4.3 — Exact Rebel Goal-Market Correction

- Replaced the previous Spartacus and Leonidas goal logic with Goal-Market Correction v1.1.
- Enforced Over 2.5 range 1.20–1.70 and mandatory Under 3.5 above 1.60.
- Enforced Under 2.5 range 1.20–1.70 and mandatory Over 1.5 above 1.60.
- Enforced Under 3.5 maximum 1.40 and automatic switch to Over 1.5 at 1.30 or lower.
- Enforced Over 3.5 accepted range 1.20–1.89.
- Added Over 2.0 Asian and Under 3.0 Asian protected downgrades and correct Void settlement.
- Preserved Spartacus 4%/55%/one-confirmation and Leonidas 6%/70%/two-confirmation standards.
- Added market-specific contradiction checks and non-automatic decision ordering.
- Added transparent Rebel metadata: original market, final market, opening/current odds, movement, books, agreement, confirmations and downgrade level.
- Added exact regression tests for examples A–H and price boundaries.
