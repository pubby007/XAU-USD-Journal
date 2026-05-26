-- =============================================
-- Run this in Supabase → SQL Editor
-- =============================================

create table trades (
  id           bigint generated always as identity primary key,
  trade_id     bigint not null unique,        -- timestamp-based ID from app
  date         text not null,
  setup        text,                          -- 'setup1' or 'setup2'
  liq_us       text,
  liq_in       text,
  entry_us     text,
  entry_in     text,
  entry_price  text,
  dir          text,                          -- 'buy' or 'sell'
  outcome      text,                          -- 'win', 'loss', 'be'
  pnl          float default 0,
  notes        text,
  created_at   timestamptz default now()
);

-- Allow public read/write (for anon key access)
alter table trades enable row level security;

create policy "Allow all" on trades
  for all using (true) with check (true);
