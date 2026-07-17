-- Betynz secure account backend for Supabase/Postgres.
-- Run in a new Supabase project before enabling backend-config.js.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 50),
  country text not null check (char_length(country) between 2 and 80),
  date_of_birth date not null check (date_of_birth <= (current_date - interval '18 years')::date),
  terms_accepted_at timestamptz not null,
  paused_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_engine text not null default 'zeus' check (char_length(favorite_engine) between 2 and 32),
  min_confidence integer not null default 76 check (min_confidence between 0 and 100),
  remember_slip boolean not null default true,
  responsible_reminder text not null default '60' check (responsible_reminder in ('30','60','90','off')),
  notifications jsonb not null default '{"newPicks":true,"pickChanges":true,"scores":true,"rebels":false,"leagues":""}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_key text not null,
  match_key text not null,
  home text not null,
  away text not null,
  market text not null,
  odds numeric(8,3),
  engine text not null,
  match_date date,
  created_at timestamptz not null default now(),
  unique(user_id, client_key)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null check (plan in ('free','pro','supreme','day')),
  status text not null check (status in ('active','trialing','past_due','paused','cancelled','expired')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_subscription_id)
);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id,status,current_period_end desc);

create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_event_id text not null unique,
  plan text not null check (plan in ('pro','supreme','day')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD' check (char_length(currency)=3),
  status text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.account_audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.saved_picks enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_records enable row level security;
alter table public.account_audit_log enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id=auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "preferences_all_own" on public.user_preferences for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "saved_picks_all_own" on public.saved_picks for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (user_id=auth.uid());
create policy "billing_select_own" on public.billing_records for select to authenticated using (user_id=auth.uid());
create policy "audit_select_own" on public.account_audit_log for select to authenticated using (user_id=auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  dob date;
  accepted timestamptz;
  display_name text;
  country_name text;
begin
  begin
    dob := (new.raw_user_meta_data->>'date_of_birth')::date;
  exception when others then
    raise exception 'A valid date of birth is required.';
  end;
  if dob > (current_date - interval '18 years')::date then
    raise exception 'Betynz accounts are restricted to adults aged 18 or older.';
  end if;
  accepted := coalesce((new.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now());
  display_name := nullif(trim(new.raw_user_meta_data->>'display_name'),'');
  country_name := nullif(trim(new.raw_user_meta_data->>'country'),'');
  if display_name is null or country_name is null then
    raise exception 'Display name and country are required.';
  end if;
  insert into public.profiles(id,display_name,country,date_of_birth,terms_accepted_at)
  values(new.id,left(display_name,50),left(country_name,80),dob,accepted);
  insert into public.user_preferences(user_id) values(new.id) on conflict do nothing;
  insert into public.account_audit_log(user_id,event_type,metadata) values(new.id,'account_created',jsonb_build_object('email_verified',new.email_confirmed_at is not null));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.effective_plan(target_user uuid)
returns text
language sql
stable
security definer
set search_path=public
as $$
  select coalesce((
    select s.plan from public.subscriptions s
    where s.user_id=target_user
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end>now())
    order by case s.plan when 'supreme' then 4 when 'day' then 3 when 'pro' then 2 else 1 end desc,
             s.current_period_end desc nulls first
    limit 1
  ),'free');
$$;
revoke all on function public.effective_plan(uuid) from public;

create or replace function public.get_my_account_state()
returns jsonb
language sql
stable
security definer
set search_path=public,auth
as $$
  select jsonb_build_object(
    'id',u.id,
    'email',u.email,
    'email_verified',u.email_confirmed_at is not null,
    'display_name',p.display_name,
    'country',p.country,
    'created_at',p.created_at,
    'paused_until',p.paused_until,
    'plan',public.effective_plan(u.id),
    'plan_expires_at',(
      select s.current_period_end from public.subscriptions s
      where s.user_id=u.id and s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end>now())
      order by case s.plan when 'supreme' then 4 when 'day' then 3 when 'pro' then 2 else 1 end desc limit 1
    )
  )
  from auth.users u join public.profiles p on p.id=u.id
  where u.id=auth.uid();
$$;
grant execute on function public.get_my_account_state() to authenticated;

create or replace function public.pause_my_account(pause_days integer default 7)
returns timestamptz
language plpgsql
security definer
set search_path=public
as $$
declare until_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  until_at := now() + make_interval(days=>greatest(1,least(30,pause_days)));
  update public.profiles set paused_until=until_at,updated_at=now() where id=auth.uid();
  insert into public.account_audit_log(user_id,event_type,metadata) values(auth.uid(),'access_paused',jsonb_build_object('until',until_at));
  return until_at;
end;
$$;
grant execute on function public.pause_my_account(integer) to authenticated;

create or replace function public.sync_my_saved_picks(payload jsonb)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(payload)<>'array' or jsonb_array_length(payload)>100 then raise exception 'Invalid saved-picks payload'; end if;
  delete from public.saved_picks where user_id=auth.uid();
  for item in select value from jsonb_array_elements(payload)
  loop
    insert into public.saved_picks(user_id,client_key,match_key,home,away,market,odds,engine,match_date)
    values(
      auth.uid(),left(coalesce(item->>'client_key',''),240),left(coalesce(item->>'match_key',''),160),left(coalesce(item->>'home',''),120),left(coalesce(item->>'away',''),120),left(coalesce(item->>'market',''),120),
      case when nullif(item->>'odds','') is null then null else (item->>'odds')::numeric end,left(coalesce(item->>'engine',''),80),case when nullif(item->>'match_date','') is null then null else (item->>'match_date')::date end
    );
  end loop;
end;
$$;
grant execute on function public.sync_my_saved_picks(jsonb) to authenticated;

revoke all on public.subscriptions from anon,authenticated;
revoke all on public.billing_records from anon,authenticated;
grant select on public.subscriptions,public.billing_records to authenticated;
grant select,insert,update,delete on public.saved_picks to authenticated;
grant select,insert,update,delete on public.user_preferences to authenticated;
grant select,update on public.profiles to authenticated;
