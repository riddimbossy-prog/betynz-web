# Betynz v5.6 — PPG & Defence Decision Rules

- Adds a universal Straight Win rule when the selected team has at least 2.00 PPG in both overall and venue-split samples, while the opponent is below 1.00 PPG in both samples.
- Requires the opponent defence to be medium or leaky (at least 1.00 goals conceded per relevant venue match) before the automatic Straight Win is published.
- Downgrades every other Straight Win signal to DNB when the full 2.00-versus-sub-1.00 standard is incomplete.
- Replaces the automatic GG rule with: both teams at least 1.50 PPG overall and split, high-scoring league (2.80+ GPG), draw odds at least 3.70, and both venue defences medium or leaky.
- Adds a low-PPG Under rule for teams below 1.00 PPG overall and split in medium/low-scoring leagues with draw odds no higher than 3.00.
- Routes the low-PPG rule to Under 2.5 when neither defence is leaky, and Under 3.5 when at least one defence is leaky.
- Preserves the overall/split PPG direction agreement gate, Rebel rules, audit logs, quarantine controls, accounts and community features.
- Adds match-popup defence classifications and a dedicated automated rule test suite.
