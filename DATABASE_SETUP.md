# Betynz database setup

The public browser talks only to the Render API. The Render API uses Supabase with the service-role key.

## Tables

`leagues`, `teams`, `fixtures`, `team_htft_profiles`, `team_goal_profiles`, `predictions`, and `prediction_results` are created by the included migration.

## Automatic data lifecycle

1. `database-coverage.yml` imports today and the following six days.
2. `syncDate` upserts leagues, teams and fixtures from API-Football.
3. Profile hydration imports recent team history where local evidence is insufficient.
4. The engine writes one current Betynz prediction per fixture and engine version.
5. `database-refresh.yml` refreshes today’s scores and predictions every 30 minutes.
6. Finished selections are graded into `prediction_results`.
7. The frontend polls the public dashboard endpoint every five minutes.

## Security

All football tables have row-level security enabled and direct `anon`/`authenticated` table privileges revoked. The service-role key must remain only in Render. Protected refresh routes require `x-admin-secret`.
