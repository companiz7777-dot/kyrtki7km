-- KURTKI 7KM — схема бази для Supabase (Postgres).
-- Запускати один раз: Supabase → SQL Editor → вставити весь файл → Run.
-- Ціна в гривнях рахується ТУТ, на сервері (view public_catalog), а не в браузері.

-- ============ адміністратори ============
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email   text not null,
  role    text not null check (role in ('owner','manager')),
  created_at timestamptz not null default now()
);

create or replace function public.admin_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.admins where user_id = auth.uid()
$$;

-- ============ курс долара (з історією) ============
create table if not exists public.rates (
  id bigint generated always as identity primary key,
  rate numeric(10,2) not null check (rate > 1 and rate < 1000),
  note text not null default '',
  set_at timestamptz not null default now(),
  set_by uuid default auth.uid(),
  set_by_email text default (auth.jwt() ->> 'email')
);

-- ============ товари ============
create table if not exists public.products (
  id text primary key,
  sort_order int not null default 0,
  data jsonb not null,                       -- назва, опис, фото, колір, характеристики…
  price_usd numeric(10,2) not null default 0 check (price_usd >= 0),
  old_price_usd numeric(10,2) not null default 0 check (old_price_usd >= 0),
  stock jsonb not null default '{}'::jsonb,  -- {"S":2,"M":0,"L":1}
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ журнал змін ============
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  user_email text default (auth.jwt() ->> 'email'),
  product_id text,
  action text not null,
  summary text not null default ''
);

-- ============ тригери: updated_at + запис у журнал ============
create or replace function public.trg_products_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare s text[] := '{}'; k text;
begin
  new.updated_at := now();
  if new.price_usd is distinct from old.price_usd then s := s || format('ціна: %s $ → %s $', old.price_usd, new.price_usd); end if;
  if new.old_price_usd is distinct from old.old_price_usd then s := s || format('стара ціна: %s → %s $', old.old_price_usd, new.old_price_usd); end if;
  if new.hidden is distinct from old.hidden then s := s || case when new.hidden then 'приховано з сайту' else 'повернено на сайт' end; end if;
  for k in select jsonb_object_keys(old.stock || new.stock) loop
    if (old.stock -> k) is distinct from (new.stock -> k) then
      s := s || format('%s: %s → %s', k, coalesce(old.stock ->> k, '—'), coalesce(new.stock ->> k, '—'));
    end if;
  end loop;
  if new.data is distinct from old.data then s := s || 'опис / колір / характеристики змінено'; end if;
  if array_length(s, 1) > 0 then
    insert into public.audit_log(product_id, action, summary) values (new.id, 'Товар', array_to_string(s, '; '));
  end if;
  return new;
end $$;
drop trigger if exists products_audit on public.products;
create trigger products_audit before update on public.products for each row execute function public.trg_products_audit();

create or replace function public.trg_rates_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(product_id, action, summary) values ('—', 'Курс', format('курс: %s', new.rate));
  return new;
end $$;
drop trigger if exists rates_audit on public.rates;
create trigger rates_audit after insert on public.rates for each row execute function public.trg_rates_audit();

-- ============ права доступу (RLS) ============
alter table public.admins    enable row level security;
alter table public.rates     enable row level security;
alter table public.products  enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid() or public.admin_role() = 'owner');

drop policy if exists rates_read on public.rates;
create policy rates_read on public.rates for select to authenticated using (public.admin_role() is not null);
drop policy if exists rates_owner_insert on public.rates;
create policy rates_owner_insert on public.rates for insert to authenticated with check (public.admin_role() = 'owner');

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated using (public.admin_role() is not null);
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated
  using (public.admin_role() is not null) with check (public.admin_role() is not null);

drop policy if exists products_owner_insert on public.products;
create policy products_owner_insert on public.products for insert to authenticated with check (public.admin_role() = 'owner');

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated using (public.admin_role() is not null);
-- запис у журнал робить лише тригер; історію курсу та журнал змінити/видалити не можна нікому через API

-- ============ вітрина для сайту (ціна в гривнях рахується тут) ============
create or replace view public.public_catalog as
with r as (select rate from public.rates order by set_at desc, id desc limit 1)
select p.id, p.sort_order, p.data, p.stock,
       (round(p.price_usd * r.rate / 10) * 10)::int as price_uah,
       case when p.old_price_usd > p.price_usd then (round(p.old_price_usd * r.rate / 10) * 10)::int else 0 end as old_price_uah
from public.products p cross join r
where not p.hidden
  and p.price_usd > 0
  and exists (select 1 from jsonb_each_text(p.stock) e where e.value::int > 0);

revoke all on public.products, public.rates, public.audit_log, public.admins from anon;
grant select on public.public_catalog to anon, authenticated;

-- власниця адмінки
insert into public.admins(user_id, email, role)
select id, email, 'owner' from auth.users where email = 'lena.alexiy@gmail.com'
on conflict (user_id) do nothing;

