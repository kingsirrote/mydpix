-- Paystack billing fields (replaces the Stripe-specific columns for new signups;
-- old stripe_customer_id/stripe_subscription_id columns are left in place,
-- unused, rather than dropped, in case any historical data referenced them).

alter table public.profiles
  add column if not exists paystack_customer_code text,
  add column if not exists paystack_subscription_code text,
  add column if not exists paystack_email_token text;

create unique index if not exists profiles_paystack_subscription_code_idx
  on public.profiles (paystack_subscription_code)
  where paystack_subscription_code is not null;

insert into public.site_settings (key, value) values
  ('topup_price_naira', '2500')
on conflict (key) do nothing;
