# Betynz.com — Rebel Final Goal-Market Gates v1.2

These gates apply to both **Spartacus** and **Leonidas**. They override the earlier final-selection limits for **Under 3.5 Goals** and **Over 1.5 Goals**. All normal movement, bookmaker-count, agreement, confirmation, contradiction and freshness requirements still apply.

## Under 3.5 Goals — final approved market

Under 3.5 may be published only when every condition below passes:

- Over 1.5 odds are **greater than 1.40**.
- Under 3.5 odds are **1.30 or lower**.
- Full-Time Draw odds are **3.00 or lower**.
- BTTS No / NG odds are **1.60 or lower**.
- Under 3.5 is shortening or strongly stable under the engine's normal movement standard.
- No violent Over 2.5, First-Half Over 1.5 or Team Over 2.5 contradiction exists.

A missing price fails the gate. A price outside any one of these limits produces **No Bet** or leaves the engine free to consider another market that independently passes its own rule.

### Exact boundaries

- Over 1.5 at **1.40**: reject Under 3.5.
- Under 3.5 at **1.30**: accepted boundary.
- Under 3.5 at **1.31**: reject.
- Draw at **3.00**: accepted boundary.
- Draw at **3.01**: reject.
- NG at **1.60**: accepted boundary.
- NG at **1.61**: reject.

## Over 1.5 Goals — final approved market

Over 1.5 may be published only when every condition below passes:

- Under 3.5 odds are **greater than 1.40**.
- Over 1.5 odds are **1.29 or lower**.
- Full-Time Draw odds are **greater than 3.50**.
- BTTS Yes / GG odds are **1.60 or lower**.
- Over 1.5 is stable or shortening.
- No strong Under 2.5 signal or dominant low-scoring HT/FT contradiction exists.
- At least the engine's required related-market confirmation count passes.

A missing price fails the gate. Over 1.5 cannot be used as a safety downgrade unless all four price checks pass.

### Exact boundaries

- Under 3.5 at **1.40**: reject Over 1.5.
- Under 3.5 at **1.41**: accepted boundary.
- Over 1.5 at **1.29**: accepted boundary.
- Over 1.5 at **1.30**: reject.
- Draw at **3.50**: reject.
- Draw at **3.51**: accepted boundary.
- GG at **1.60**: accepted boundary.
- GG at **1.61**: reject.

## Engine standards remain unchanged

### Spartacus

- At least 3 bookmakers.
- At least 55% agreement.
- At least 4% main-market movement.
- At least 1 related confirmation.
- One mild contradiction may trigger a downgrade.

### Leonidas

- At least 5 bookmakers.
- At least 70% agreement.
- At least 6% main-market movement; 8% or more preferred.
- At least 2 related confirmations.
- No major contradiction.

## Final rule

These are hard final-market gates. A market that fails cannot be published merely because it appears in a downgrade ladder.
