# Betynz v4.7 — Universal GG High-Scoring Rule

## New final-board rule

The public board selects **BTTS Yes (GG)** when every condition below is true:

- Home overall PPG is greater than 1.50.
- Away overall PPG is greater than 1.50.
- League scoring average is at least 2.80 goals per match (High-Scoring or Very High-Scoring).
- Under 3.5 odds are greater than 1.60.
- Draw odds are greater than 3.70.
- The existing Betynz 1X2 balance detector marks the match as balanced.
- First-Half Over 1.5 odds are below 2.00.
- BTTS Yes/GG odds are 1.70 or lower.

All eight checks are mandatory. Missing odds or a failed threshold blocks the rule.

## Publication behavior

- The rule runs at the final Zeus decision layer, so Dashboard, Match Board and Banker Board show the same GG selection.
- The match explanation popup displays both PPG values, league GPG and every qualifying market price.
- Previously locked picks are not rewritten retroactively. New and provisional decisions use the v4.7 rule.
- Existing Olympian, Rebel, settlement, live-score and workflow behavior remains intact.
