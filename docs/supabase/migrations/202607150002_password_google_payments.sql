-- Betynz v5.0: password auth, Google onboarding and verified Paystack subscriptions.
-- Run after 202607150001_secure_accounts.sql.

alter table public.subscriptions add column if not exists cycle text check (cycle in ('monthly','annual','day'));
alter table public.subscriptions add column if not exists provider_plan_code text;
alter table public.subscriptions add column if not exists provider_email_token text;
alter table public.subscriptions add column if not exists amount numeric(12,2);
alter table public.subscriptions add column if not exists currency text check (currency is null or char_length(currency)=3);
alter table public.subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table public.subscriptions add column if not exists last_payment_at timestamptz;

create table if not exists public.payment_events (
  provider text not null,
  event_key text not null,
  event_type text not null,
  status text not null default 'processing' check (status in ('processing','processed','failed')),
  last_error text,
  processed_at timestamptz not null default now(),
  primary key(provider,event_key)
);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon,authenticated;


-- A cancelled recurring plan remains usable until its verified paid period ends.
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
      and s.status in ('active','trialing','cancelled')
      and (s.current_period_end is null or s.current_period_end>now())
    order by case s.plan when 'supreme' then 4 when 'day' then 3 when 'pro' then 2 else 1 end desc,
             s.current_period_end desc nulls first
    limit 1
  ),'free');
$$;
revoke all on function public.effective_plan(uuid) from public;

-- Google OAuth can create an auth user before Betynz has date of birth and country.
-- This trigger creates a profile only when all mandatory adult-account metadata exists.
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
  display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'full_name','')),'');
  country_name := nullif(trim(coalesce(new.raw_user_meta_data->>'country','')),'');

  begin
    dob := nullif(new.raw_user_meta_data->>'date_of_birth','')::date;
  exception when others then
    dob := null;
  end;

  if display_name is null or country_name is null or dob is null then
    return new;
  end if;

  if dob > (current_date - interval '18 years')::date then
    raise exception 'Betynz accounts are restricted to adults aged 18 or older.';
  end if;

  accepted := coalesce(nullif(new.raw_user_meta_data->>'terms_accepted_at','')::timestamptz,now());
  insert into public.profiles(id,display_name,country,date_of_birth,terms_accepted_at)
  values(new.id,left(display_name,50),left(country_name,80),dob,accepted)
  on conflict (id) do update set
    display_name=excluded.display_name,
    country=excluded.country,
    date_of_birth=excluded.date_of_birth,
    terms_accepted_at=excluded.terms_accepted_at,
    updated_at=now();
  insert into public.user_preferences(user_id) values(new.id) on conflict do nothing;
  insert into public.account_audit_log(user_id,event_type,metadata)
  values(new.id,'account_created',jsonb_build_object('email_verified',new.email_confirmed_at is not null,'provider',coalesce(new.raw_app_meta_data->>'provider','email')));
  return new;
end;
$$;

create or replace function public.complete_my_profile(
  p_display_name text,
  p_country text,
  p_date_of_birth date,
  p_terms_accepted boolean
)
returns boolean
language plpgsql
security definer
set search_path=public,auth
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not coalesce(p_terms_accepted,false) then raise exception 'Terms acceptance is required'; end if;
  if char_length(trim(coalesce(p_display_name,''))) < 2 then raise exception 'Display name is required'; end if;
  if char_length(trim(coalesce(p_country,''))) < 2 then raise exception 'Country is required'; end if;
  if p_date_of_birth is null or p_date_of_birth > (current_date - interval '18 years')::date then
    raise exception 'Betynz accounts are restricted to adults aged 18 or older.';
  end if;

  insert into public.profiles(id,display_name,country,date_of_birth,terms_accepted_at)
  values(auth.uid(),left(trim(p_display_name),50),left(trim(p_country),80),p_date_of_birth,now())
  on conflict (id) do update set
    display_name=excluded.display_name,
    country=excluded.country,
    date_of_birth=excluded.date_of_birth,
    terms_accepted_at=excluded.terms_accepted_at,
    updated_at=now();
  insert into public.user_preferences(user_id) values(auth.uid()) on conflict do nothing;
  insert into public.account_audit_log(user_id,event_type,metadata)
  values(auth.uid(),'profile_completed',jsonb_build_object('adult_verified',true));
  return true;
end;
$$;
grant execute on function public.complete_my_profile(text,text,date,boolean) to authenticated;

create or replace function public.get_my_account_state()
returns jsonb
language sql
stable
security definer
set search_path=public,auth
as $$
  with active_sub as (
    select s.*
    from public.subscriptions s
    where s.user_id=auth.uid()
      and s.status in ('active','trialing','past_due','cancelled')
      and (s.current_period_end is null or s.current_period_end>now())
    order by case s.plan when 'supreme' then 4 when 'day' then 3 when 'pro' then 2 else 1 end desc,
             s.current_period_end desc nulls first
    limit 1
  )
  select jsonb_build_object(
    'id',u.id,
    'email',u.email,
    'email_verified',u.email_confirmed_at is not null,
    'google_name',coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name'),
    'profile_complete',p.id is not null,
    'display_name',p.display_name,
    'country',p.country,
    'created_at',coalesce(p.created_at,u.created_at),
    'paused_until',p.paused_until,
    'plan',case when p.id is null then 'free' else public.effective_plan(u.id) end,
    'plan_expires_at',(select current_period_end from active_sub),
    'subscription_provider',(select provider from active_sub),
    'subscription_cycle',(select cycle from active_sub),
    'cancel_at_period_end',coalesce((select cancel_at_period_end from active_sub),false),
    'can_cancel_subscription',coalesce((select provider='paystack' and cycle in ('monthly','annual') and provider_subscription_id is not null and provider_email_token is not null and not cancel_at_period_end from active_sub),false)
  )
  from auth.users u
  left join public.profiles p on p.id=u.id
  where u.id=auth.uid();
$$;
grant execute on function public.get_my_account_state() to authenticated;
