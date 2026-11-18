-- 03: Functions customers use, and live updates.

-- place_order: the only way a customer can create an order.
-- The browser sends dish ids and quantities only; prices and the total come from the database.
create or replace function public.place_order(p_customer_name text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name   text := trim(coalesce(p_customer_name, ''));
  v_order  public.orders;
  v_lines  int;
  v_found  int;
  v_total  numeric(8,2);
begin
  if char_length(v_name) = 0 or char_length(v_name) > 40 then
    raise exception 'Please enter your name (up to 40 characters)';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'Too many different items in one order';
  end if;

  -- Every quantity must be 1 to 20
  if exists (
    select 1 from jsonb_to_recordset(p_items) as c(menu_item_id bigint, quantity int)
    where c.quantity is null or c.quantity < 1 or c.quantity > 20
  ) then
    raise exception 'Each quantity must be between 1 and 20';
  end if;

  -- Every dish must exist and be available today; the total uses the real prices
  select count(*), count(m.id), sum(m.price * c.quantity)
    into v_lines, v_found, v_total
  from jsonb_to_recordset(p_items) as c(menu_item_id bigint, quantity int)
  left join public.menu_items m on m.id = c.menu_item_id and m.is_available;
  if v_found <> v_lines then
    raise exception 'Something in your cart is no longer available';
  end if;

  insert into public.orders (customer_name, total) values (v_name, v_total) returning * into v_order;

  -- Save each line with the price at the time of ordering
  insert into public.order_items (order_id, menu_item_id, quantity, unit_price)
  select v_order.id, c.menu_item_id, c.quantity, m.price
  from jsonb_to_recordset(p_items) as c(menu_item_id bigint, quantity int)
  join public.menu_items m on m.id = c.menu_item_id;

  return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number);
end;
$$;

-- get_order_status: a customer can see ONE order, and only if they know its id (from their link).
create or replace function public.get_order_status(p_order_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'status', o.status,
    'total', o.total,
    'created_at', o.created_at,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', m.name, 'quantity', i.quantity, 'unit_price', i.unit_price) order by i.id), '[]'::jsonb)
              from public.order_items i join public.menu_items m on m.id = i.menu_item_id
              where i.order_id = o.id)
  )
  from public.orders o where o.id = p_order_id;
$$;

-- get_kitchen_wait: an estimate only. Each active order takes as long as its slowest dish,
-- and the kitchen works through them one after another. Returns numbers only, no customer data.
create or replace function public.get_kitchen_wait()
returns jsonb language sql stable security definer set search_path = '' as $$
  with active as (
    select o.id, max(m.prep_time_minutes) as minutes
    from public.orders o
    join public.order_items i on i.order_id = o.id
    join public.menu_items m on m.id = i.menu_item_id
    where o.status in ('pending', 'preparing')
    group by o.id
  )
  select jsonb_build_object('active_orders', count(*), 'queue_minutes', coalesce(sum(minutes), 0)) from active;
$$;

revoke all on function public.place_order(text, jsonb) from public;
revoke all on function public.get_order_status(uuid) from public;
revoke all on function public.get_kitchen_wait() from public;
grant execute on function public.place_order(text, jsonb) to anon, authenticated;
grant execute on function public.get_order_status(uuid) to anon, authenticated;
grant execute on function public.get_kitchen_wait() to anon, authenticated;

-- Live updates for customers: when an order's status changes, send a message on a channel
-- named after that order's id. Only someone with the order link knows the id.
create or replace function public.broadcast_order_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform realtime.send(
      jsonb_build_object('status', new.status),
      'status_changed',
      'order:' || new.id::text,
      false
    );
  end if;
  return new;
end;
$$;
revoke all on function public.broadcast_order_status() from public, anon, authenticated;
create trigger orders_broadcast_status after update of status on public.orders
  for each row execute function public.broadcast_order_status();

-- Live updates for staff: new and changed orders (RLS still applies, so only staff receive them)
alter publication supabase_realtime add table public.orders;
