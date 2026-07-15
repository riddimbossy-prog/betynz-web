# Betynz.com — Spartacus Rebel Engine v1.1

> **Goal-market override:** Final Under 3.5 and Over 1.5 selections must pass every hard price gate in `GOAL_MARKET_SETTLEMENT_GATES_v1.2.md`.

## 1. Identity

Spartacus is the broader rebel engine. It studies opening prices, current prices, bookmaker agreement and cross-market movement. When an aggressive market passes directionally but lacks full strength, Spartacus downgrades it.

## 2. Minimum standard

- Three bookmakers minimum.
- 55% bookmaker agreement minimum.
- One related-market confirmation minimum.
- Fresh odds and a verified fixture match.
- One mild contradiction may be allowed with a downgrade.

Movement levels:

- Under 3%: noise.
- 3%–3.99%: weak protection signal.
- 4%–5.99%: valid reduced signal.
- 6%–7.99%: confirmed.
- 8%–11.99%: strong.
- 12% or more: extreme; verify before use.

## 3. Strength levels

### S3 — Strong

- Main market shortens at least 6%.
- Two related markets confirm.
- 65% bookmaker agreement.
- No major contradiction.

Use the strongest qualifying market.

### S2 — Reduced

- Main market shortens 4%–5.99%.
- One related market confirms.
- 55% bookmaker agreement.
- One mild contradiction allowed.

Downgrade one level.

### S1 — Protected

- Movement is 3%–3.99%.
- Related markets are stable.
- No violent opposition.

Downgrade two levels. Anything weaker is No Bet.

## 4. Favourite rules

### Strong favourite

Requirements:

- Favourite: 1.20–1.55.
- Opponent: 5.00 or higher.
- Draw: greater than 3.60.
- Under 3.5: at least 1.40.
- BTTS No: 1.70 or lower.
- Favourite shortens at least 5%.
- Opponent drifts at least 5%.
- Favourite-aligned HT/FT outcome shortens.

Home confirmations: 1/1 or X/1.

Away confirmations: 2/2 or X/2.

Downgrade ladder:

1. Straight Win
2. Draw No Bet
3. Double Chance
4. No Bet

### Moderate favourite

Requirements:

- Favourite: 1.56–1.90.
- Opponent: at least 4.00.
- Draw: at least 3.30.
- Favourite, DNB and Double Chance markets support the same team.

Downgrade ladder:

1. Draw No Bet
2. Double Chance
3. +0.5 Asian Handicap
4. No Bet

## 5. Goal markets

Use `GOAL_MARKET_RULES_v1.1.md` as the controlling goal-market document.

## 6. BTTS Yes

Requirements:

- Odds: 1.55–1.90.
- Shortens at least 5%.
- Both Team Over 0.5 markets support goals.
- No strong clean-sheet contradiction.

Downgrade ladder:

1. BTTS Yes
2. Over 2.0 Asian Goals
3. Over 1.5
4. No Bet

## 7. BTTS No

Requirements:

- Odds: 1.45–1.80.
- Shortens at least 5%.
- One Team Under 0.5 shortens.
- Under 3.5 supports a controlled match.

Downgrade ladder:

1. BTTS No or Favourite Win to Nil
2. Opponent Team Under 1.5
3. Under 3.5
4. No Bet

## 8. Favourite Team Over 1.5

Requirements:

- Favourite: 1.20–1.70.
- Opponent: at least 4.50.
- Team Over 1.5: 1.45–1.95.
- First-Half Over 1.5: 1.80 or lower.
- Team Over 1.5 shortens at least 5%.

Downgrade ladder:

1. Favourite Team Over 1.5
2. Favourite Team Over 1.0 Asian
3. Favourite Team Over 0.5
4. No Bet

## 9. First-half markets

### First-Half Over 1.5

- Odds: 1.60–2.05.
- Shortens at least 6%.
- Over 2.5 or a team-goal market confirms.

Ladder: First-Half Over 1.5 → First-Half Over 1.0 Asian → First-Half Over 0.5 → No Bet.

### First-Half Under 1.5

- Odds: 1.35–1.75.
- Shortens at least 5%.
- First-Half Draw and X/1, X/X or X/2 confirm.

Ladder: First-Half Under 1.5 → First-Half Under 2.0 Asian → Match Under 3.5 → No Bet.

## 10. HT/FT markets

Required outcomes: 1/1, X/1, 2/1, 1/X, X/X, 2/X, 1/2, X/2 and 2/2.

### 1/1 or 2/2

Direct HT/FT → Win Either Half → Straight Win → DNB → No Bet.

### X/1 or X/2

Direct HT/FT → Straight Win → DNB → Double Chance → No Bet.

### 2/1 or 1/2 comeback

Requirements:

- Favourite: 1.35–1.90.
- Direct comeback HT/FT shortens at least 12%.
- Opponent first-half win price shortens.
- Favourite remains supported at full time.
- BTTS Yes and Over 2.5 support goals.

Ladder: comeback HT/FT → Favourite Win → Favourite DNB → Favourite Double Chance → No Bet.

### X/X

X/X → Full-Time Draw → First-Half Draw → Under 3.5 → No Bet.

### 1/X or 2/X

Direct HT/FT → Full-Time Draw → leader Double Chance → BTTS Yes → No Bet.

## 11. Asian handicap ladders

- Favourite -1.5 → -1.0 → -0.75 → -0.5 → DNB → Double Chance → No Bet.
- Favourite -1.0 → -0.75 → -0.5 → DNB → Double Chance → No Bet.
- Favourite -0.75 → -0.5 → DNB → Double Chance → No Bet.

## 12. Conflict rule

- One mild contradiction: downgrade one level.
- Two mild contradictions: downgrade two levels.
- One major contradiction: No Bet.
- Violent opposing bookmaker consensus: No Bet.

## 13. Confidence

- 83–100: Spartacus Elite.
- 76–82: Spartacus Strong.
- 68–75: Spartacus Protected.
- Below 68: No Bet.
