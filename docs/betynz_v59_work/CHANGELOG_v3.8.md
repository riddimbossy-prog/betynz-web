# Betynz v3.8

## Workflow persistence fix

- Keeps **Smart Global Coverage and Deep Enrichment** visible in GitHub Actions after product updates.
- Removes the unsupported direct `secrets` reference from the step-level `if` expression.
- Maps API credentials into the job environment and checks TheStatsAPI through `env.STATS_API_KEY`.
- Normalizes hidden line breaks in API credentials before requests.
- Preserves today plus six days of global fixture coverage and adaptive deep enrichment.
- Verified all workflow YAML files parse successfully and no workflow uses `secrets.*` directly inside an `if:` condition.
