-- 05: Staff can mark a dish as sold out (or back on) for the day.
-- They may only change is_available, nothing else about the dish.
create policy "Staff can update dish availability" on public.menu_items
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
grant update (is_available) on public.menu_items to authenticated;
