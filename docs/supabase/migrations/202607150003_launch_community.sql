-- Betynz v5.3 community, follows and retention backend.
-- Run after 202607150001_secure_accounts.sql and 202607150002_password_google_payments.sql.

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_key text not null check (char_length(match_key) between 1 and 180),
  body text not null check (char_length(body) between 2 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists community_comments_match_idx on public.community_comments(match_key,created_at);

create table if not exists public.community_reactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_key text not null check (char_length(match_key) between 1 and 180),
  reaction text not null check (reaction in ('useful','strong','watch')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,match_key)
);
create index if not exists community_reactions_match_idx on public.community_reactions(match_key,reaction);

create table if not exists public.user_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('engine','league','team')),
  item_key text not null check (char_length(item_key) between 1 and 160),
  label text not null check (char_length(label) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key(user_id,item_type,item_key)
);

create table if not exists public.user_activity_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key(user_id,activity_date)
);

alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.user_follows enable row level security;
alter table public.user_activity_days enable row level security;

drop policy if exists "comments_public_read" on public.community_comments;
create policy "comments_public_read" on public.community_comments for select to anon,authenticated using (deleted_at is null);
drop policy if exists "comments_insert_own" on public.community_comments;
create policy "comments_insert_own" on public.community_comments for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "comments_update_own" on public.community_comments;
create policy "comments_update_own" on public.community_comments for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "reactions_public_read" on public.community_reactions;
create policy "reactions_public_read" on public.community_reactions for select to anon,authenticated using (true);
drop policy if exists "reactions_all_own" on public.community_reactions;
create policy "reactions_all_own" on public.community_reactions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "follows_all_own" on public.user_follows;
create policy "follows_all_own" on public.user_follows for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "activity_all_own" on public.user_activity_days;
create policy "activity_all_own" on public.user_activity_days for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

grant select on public.community_comments,public.community_reactions to anon,authenticated;
grant insert,update on public.community_comments to authenticated;
grant insert,update,delete on public.community_reactions to authenticated;
grant select,insert,update,delete on public.user_follows,public.user_activity_days to authenticated;

-- Secure admin overview. The flag can only be set from the SQL editor/service role.
alter table public.profiles add column if not exists is_admin boolean not null default false;
revoke update on public.profiles from authenticated;
grant update(display_name,country,date_of_birth,updated_at) on public.profiles to authenticated;

create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,auth
as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and is_admin=true) then
    raise exception 'Administrator access required';
  end if;
  return jsonb_build_object(
    'users',(select count(*) from public.profiles),
    'comments',(select count(*) from public.community_comments where deleted_at is null),
    'follows',(select count(*) from public.user_follows),
    'active_7d',(select count(distinct user_id) from public.user_activity_days where activity_date>=current_date-6),
    'comments_24h',(select count(*) from public.community_comments where deleted_at is null and created_at>=now()-interval '24 hours')
  );
end;
$$;
grant execute on function public.get_admin_overview() to authenticated;

create or replace function public.get_my_account_state()
returns jsonb
language sql
stable
security definer
set search_path=public,auth
as $$
  with active_sub as (
    select s.* from public.subscriptions s
    where s.user_id=auth.uid()
      and s.status in ('active','trialing','past_due','cancelled')
      and (s.current_period_end is null or s.current_period_end>now())
    order by case s.plan when 'supreme' then 4 when 'day' then 3 when 'pro' then 2 else 1 end desc,
             s.current_period_end desc nulls first limit 1
  )
  select jsonb_build_object(
    'id',u.id,'email',u.email,'email_verified',u.email_confirmed_at is not null,
    'google_name',coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name'),
    'profile_complete',p.id is not null,'display_name',p.display_name,'country',p.country,
    'created_at',coalesce(p.created_at,u.created_at),'paused_until',p.paused_until,
    'is_admin',coalesce(p.is_admin,false),
    'plan',case when p.id is null then 'free' else public.effective_plan(u.id) end,
    'plan_expires_at',(select current_period_end from active_sub),
    'subscription_provider',(select provider from active_sub),
    'subscription_cycle',(select cycle from active_sub),
    'cancel_at_period_end',coalesce((select cancel_at_period_end from active_sub),false),
    'can_cancel_subscription',coalesce((select provider='paystack' and cycle in ('monthly','annual') and provider_subscription_id is not null and provider_email_token is not null and not cancel_at_period_end from active_sub),false)
  )
  from auth.users u left join public.profiles p on p.id=u.id where u.id=auth.uid();
$$;
grant execute on function public.get_my_account_state() to authenticated;
