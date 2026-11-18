-- 02: Row Level Security. Who can read or change what.

-- Helper: is the signed-in user a staff member? Kept in a private schema the API can't reach.
create schema if not exists private;
create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_profiles where id = (select auth.uid()));
$$;
grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;

alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.staff_profiles enable row level security;

-- Everyone can read the menu
create policy "Anyone can read categories" on public.categories
  for select to anon, authenticated using (true);
create policy "Anyone can read menu items" on public.menu_items
  for select to anon, authenticated using (true);

-- Only staff can see orders and change their status.
-- Customers never read these tables directly; they use place_order and get_order_status.
create policy "Staff can read orders" on public.orders
  for select to authenticated using ((select private.is_staff()));
create policy "Staff can update orders" on public.orders
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff can read order items" on public.order_items
  for select to authenticated using ((select private.is_staff()));

-- Staff can read their own profile (used to check they're staff after login)
create policy "Staff can read own profile" on public.staff_profiles
  for select to authenticated using (id = (select auth.uid()));

-- Staff may only change the status column, nothing else
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;

-- Nobody writes to these tables directly through the API
revoke insert, update, delete on public.orders, public.order_items from anon;
revoke insert, delete on public.orders, public.order_items from authenticated;
revoke insert, update, delete on public.categories, public.menu_items, public.staff_profiles from anon, authenticated;
