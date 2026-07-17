# Betynz v5.5 — Engine Audit & Reliability

- Adds a per-engine audit trace to every fixture.
- Records passed and failed publication rules, PPG agreement, data quality, market, confidence, reasons and warnings.
- Adds `config/engine-quarantine.json` for temporarily withholding a misfiring engine without deleting its code.
- Generates `engine-audit-report.json` on every main snapshot build.
- Adds reliability totals and quarantined-engine status to `BETYNZ_META` and `api-status.json`.
- Extends System Health with approval, rejection, No Bet and top-failure reporting.
- Preserves all v5.4 prediction rules, settlement history, accounts, community and free access.
