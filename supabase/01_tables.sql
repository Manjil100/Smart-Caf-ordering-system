-- 01: Tables for the menu, orders and staff.

-- Menu
create table public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort_order int not null default 0
);

create table public.menu_items (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(6,2) not null check (price >= 0),
  prep_time_minutes int not null default 5 check (prep_time_minutes between 0 and 120),
  is_available boolean not null default true
);
create index menu_items_category_id_idx on public.menu_items(category_id);

-- Orders: the UUID id is private (used in the customer's tracking link);
-- order_number is the short number called out at the counter.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number int generated always as identity (start with 100),
  customer_name text not null check (char_length(customer_name) between 1 and 40),
  status text not null default 'pending'
    check (status in ('pending', 'preparing', 'ready', 'completed')),
  total numeric(8,2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at);

-- Each line of an order. unit_price keeps the price at the time of ordering,
-- so old orders stay correct if a menu price changes later.
create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id bigint not null references public.menu_items(id) on delete restrict,
  quantity int not null check (quantity between 1 and 20),
  unit_price numeric(6,2) not null check (unit_price >= 0)
);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_menu_item_id_idx on public.order_items(menu_item_id);

-- Staff: one row per staff login (Supabase Auth user)
create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- Keep updated_at current when an order changes
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
