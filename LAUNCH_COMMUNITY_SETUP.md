# Betynz v5.3 Launch and Community Setup

## Required for secure community sync
Run `supabase/migrations/202607150003_launch_community.sql` after the two existing account migrations.

The migration creates:
- `community_comments`
- `community_reactions`
- `user_follows`
- `user_activity_days`

Row-Level Security allows public reading of non-deleted comments and reaction counts. Only authenticated users can write, and users can change only their own records.

## Guest behavior
Guest follows, reactions, onboarding, visit streak and comments are stored only in the current browser. Secure accounts sync supported features through Supabase.

## System Health
The public health page reads `BETYNZ_META`, the current fixture snapshot and `api-status.json`. A snapshot older than 12 hours is marked stale.

## Community moderation
Before a large public launch, add an admin moderation queue and rate limiting through a Supabase Edge Function. The current release enforces database ownership and comment length, but it does not provide automatic content moderation.

## Enable the admin overview
After creating your own secure account, find its UUID in Supabase Authentication and run this once in the SQL editor:

```sql
update public.profiles set is_admin=true where id='YOUR_USER_UUID';
```

The website cannot grant admin rights to itself. The flag is protected from authenticated client updates.
