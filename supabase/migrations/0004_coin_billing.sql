-- Coin-based billing system.
-- Adds subscription tiers (free/tier1/tier2/tier3), a coin balance per user,
-- an audit trail of coin transactions, and RPCs for safely spending/crediting coins.

create type public.subscription_tier as enum ('free', 'tier1', 'tier2', 'tier3');

alter table public.profiles
  add column if not exists subscription_tier public.subscription_tier not null default 'free',
  add column if not exists coin_balance int not null default 0,
  add column if not exists coin_refresh_at timestamptz not null default date_trunc('month', now()) + interval '1 month';

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null, -- positive = credit, negative = debit
  reason text not null, -- 'generation' | 'upload' | 'monthly_refresh' | 'topup_purchase' | 'admin_adjustment'
  meme_id uuid references public.memes(id) on delete set null,
  balance_after int not null,
  created_at timestamptz not null default now()
);

create index if not exists coin_transactions_user_idx on public.coin_transactions (user_id, created_at desc);

alter table public.coin_transactions enable row level security;

create policy "Users see own coin transactions" on public.coin_transactions
  for select using (auth.uid() = user_id);
create policy "Admins see all coin transactions" on public.coin_transactions
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- =========================================================
-- Spend coins atomically; returns the row so the caller can
-- read the resulting balance, or no row if the balance was insufficient.
-- =========================================================
create or replace function public.spend_coins(p_user_id uuid, p_amount int, p_reason text, p_meme_id uuid default null)
returns table (success boolean, new_balance int) as $$
declare
  v_balance int;
begin
  update public.profiles
  set coin_balance = coin_balance - p_amount
  where id = p_user_id and coin_balance >= p_amount
  returning coin_balance into v_balance;

  if v_balance is null then
    return query select false, (select coin_balance from public.profiles where id = p_user_id);
  end if;

  insert into public.coin_transactions (user_id, amount, reason, meme_id, balance_after)
  values (p_user_id, -p_amount, p_reason, p_meme_id, v_balance);

  return query select true, v_balance;
end;
$$ language plpgsql security definer;

-- =========================================================
-- Credit coins (monthly refresh, top-up purchases, admin adjustments).
-- =========================================================
create or replace function public.credit_coins(p_user_id uuid, p_amount int, p_reason text)
returns int as $$
declare
  v_balance int;
begin
  update public.profiles
  set coin_balance = coin_balance + p_amount
  where id = p_user_id
  returning coin_balance into v_balance;

  insert into public.coin_transactions (user_id, amount, reason, balance_after)
  values (p_user_id, p_amount, p_reason, v_balance);

  return v_balance;
end;
$$ language plpgsql security definer;

-- =========================================================
-- Resets a user's coin balance to their tier's monthly allotment
-- (called on subscription renewal, not additive — "refreshes monthly").
-- =========================================================
create or replace function public.refresh_monthly_coins(p_user_id uuid, p_new_balance int)
returns void as $$
begin
  update public.profiles
  set coin_balance = p_new_balance,
      coin_refresh_at = date_trunc('month', now()) + interval '1 month'
  where id = p_user_id;

  insert into public.coin_transactions (user_id, amount, reason, balance_after)
  values (p_user_id, p_new_balance, 'monthly_refresh', p_new_balance);
end;
$$ language plpgsql security definer;

-- =========================================================
-- Seed configurable coin economy settings (editable later from
-- /admin/settings without a redeploy).
-- =========================================================
insert into public.site_settings (key, value) values
  ('coin_cost_square', '1'),
  ('coin_cost_portrait', '2'),
  ('coin_cost_landscape', '2'),
  ('coin_cost_upload', '1'),
  ('tier1_monthly_coins', '40'),
  ('tier2_monthly_coins', '150'),
  ('tier3_monthly_coins', '400'),
  ('topup_coins_amount', '100')
on conflict (key) do nothing;
