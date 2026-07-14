# Betynz.com — Leonidas Rebel Engine v1.1

## 1. Identity

Leonidas is the stronger version of Spartacus. It produces fewer selections and requires stronger movement, more bookmakers, deeper agreement and more related confirmations.

## 2. Minimum standard

- Five bookmakers minimum.
- 70% bookmaker agreement minimum.
- Two related-market confirmations minimum.
- HT/FT confirmation for directional selections.
- Fresh opening and current odds.
- No major contradiction or fixture uncertainty.

Movement levels:

- Under 4%: ignore.
- 4%–5.99%: weak.
- 6%–7.99%: valid.
- 8%–11.99%: strong.
- 12%–15.99%: dominant.
- 16% or more: extreme; verify.

## 3. Strength levels

### L3 — Full Leonidas

- Main movement at least 8%.
- Three related confirmations.
- HT/FT confirmation.
- 75% bookmaker agreement.
- No major contradiction.

Use the strongest qualifying market.

### L2 — Leonidas Protected

- Main movement 6%–7.99%.
- Two related confirmations.
- 70% bookmaker agreement.
- At most one mild contradiction.

Downgrade one level.

### L1 — Leonidas Shield

- Main movement 5%–5.99%.
- Two confirmations.
- 70% bookmaker agreement.
- No sharp opposing movement.

Downgrade two levels. Anything weaker is No Bet.

## 4. Elite favourite rule

Requirements:

- Favourite: 1.20–1.50.
- Opponent: 5.50 or higher.
- Draw: greater than 3.60.
- Under 3.5: at least 1.40.
- BTTS No: 1.70 or lower.
- Favourite shortens at least 7%.
- Opponent drifts at least 7%.
- DNB and Double Chance support the favourite.
- Favourite HT/FT route shortens.

Home routes: 1/1 or X/1.

Away routes: 2/2 or X/2.

Ladder: Straight Win → DNB → Double Chance → No Bet.

## 5. Moderate favourite rule

Requirements:

- Favourite: 1.51–1.80.
- Opponent: at least 4.50.
- Draw: at least 3.50.
- Favourite shortens at least 7%.
- DNB shortens at least 6%.
- HT/FT route shortens at least 8%.

Ladder: DNB → Double Chance → +0.5 Asian Handicap → No Bet.

## 6. Goal markets

Use `GOAL_MARKET_RULES_v1.1.md` as the controlling goal-market document.

Leonidas additionally requires at least 6% movement, 70% bookmaker agreement, two confirmations and no major contradiction.

## 7. BTTS Yes

- Odds: 1.55–1.80.
- Shortens at least 7%.
- Both Team Over 0.5 markets shorten.
- Over 2.5 confirms.
- No clean-sheet market shortens.

Ladder: BTTS Yes → Over 2.0 Asian Goals → Over 1.5 → No Bet.

## 8. BTTS No

- Odds: 1.45–1.70.
- Shortens at least 7%.
- One Team Under 0.5 shortens at least 6%.
- Under 3.5 confirms.

Ladder: Win to Nil → BTTS No → Opponent Team Under 1.5 → Under 3.5 → No Bet.

## 9. Favourite Team Over 1.5

Signature Leonidas market.

Requirements:

- Favourite: 1.20–1.60.
- Opponent: at least 5.00.
- Draw: greater than 3.60.
- First-Half Over 1.5: 1.80 or lower.
- Team Over 1.5: 1.40–1.85.
- Team Over 1.5 shortens at least 7%.
- Over 2.5 shortens at least 5%.
- Favourite HT/FT route shortens.

Ladder: Team Over 1.5 → Team Over 1.0 Asian → Team Over 0.5 → No Bet.

This market overrides Straight Win when team-goal movement is stronger than 1X2 movement.

## 10. First-half markets

### First-Half Over 1.5

- Odds: 1.60–1.90.
- Shortens at least 8%.
- Over 2.5 and team goals confirm.
- First-Half Draw does not shorten.

Ladder: First-Half Over 1.5 → First-Half Over 1.0 Asian → First-Half Over 0.5 → No Bet.

### First-Half Under 1.5

- Odds: 1.35–1.65.
- Shortens at least 7%.
- First-Half Draw and X/1, X/X or X/2 confirm.

Ladder: First-Half Under 1.5 → First-Half Under 2.0 Asian → Match Under 3.5 → No Bet.

## 11. HT/FT markets

### 1/1 or 2/2

Requirements:

- Favourite: 1.20–1.50.
- Direct HT/FT shortens at least 9%.
- First-half favourite price, First-Half Over 0.5 and Team Over 1.5 confirm.

Ladder: direct HT/FT → Win Either Half → Straight Win → DNB → No Bet.

### X/1 or X/2

Requirements:

- Favourite: 1.35–1.75.
- First-Half Draw shortens at least 6%.
- First-Half Under 1.5 shortens.
- Direct HT/FT shortens at least 9%.
- Favourite FT odds remain supported.

Ladder: direct HT/FT → Straight Win → DNB → Double Chance → No Bet.

### 2/1 or 1/2 comeback

Requirements:

- Favourite: 1.35–1.75.
- Direct comeback HT/FT shortens at least 15%.
- Opponent first-half win price shortens at least 8%.
- Favourite FT odds remain supported.
- BTTS Yes and Over 2.5 confirm.
- 80% bookmaker agreement.

Ladder: comeback HT/FT → Favourite Win → Favourite DNB → Favourite Double Chance → No Bet.

### X/X

Requirements:

- X/X shortens at least 10%.
- Full-Time Draw and First-Half Draw shorten at least 7%.
- Under 2.5 or Under 3.5 confirms.
- Direct winner HT/FT routes drift.

Ladder: X/X → Full-Time Draw → First-Half Draw → Under 3.5 → No Bet.

### 1/X or 2/X

Requirements:

- Direct HT/FT shortens at least 13%.
- First-half leader price shortens.
- Full-Time Draw shortens.
- Leader's FT win price drifts.
- BTTS Yes and Under 3.5 support the route.
- 80% bookmaker agreement.

Ladder: direct HT/FT → Full-Time Draw → leader Double Chance → BTTS Yes → No Bet.

## 12. Asian handicap ladders

- Favourite -1.5 → -1.0 → -0.75 → Straight Win → DNB → No Bet.
- Favourite -1.0 → -0.75 → -0.5 → DNB → Double Chance → No Bet.
- Favourite -0.75 → -0.5 → DNB → Double Chance → No Bet.

## 13. Conflict rule

Leonidas rejects when two major market families oppose each other, all favourite HT/FT routes drift, goal and team-total markets strongly disagree, opening odds are missing, movement repeatedly reverses or sharp-bookmaker direction opposes the majority.

One mild contradiction is permitted only with a downgrade.

## 14. Confidence

- 90–100: Leonidas Supreme.
- 84–89: Leonidas Elite.
- 78–83: Leonidas Protected.
- Below 78: No Bet.

Comeback and reversal HT/FT selections cannot exceed 86.
