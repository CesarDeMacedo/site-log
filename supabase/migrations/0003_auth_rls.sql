-- ============================================================================
-- Auth phase: replace the permissive MVP policies with authenticated-only
-- access. Any signed-in user has full read/write on everything (no per-owner
-- isolation yet); anonymous requests are denied — anon keeps no policy at all.
-- Existing rows have no owner column and stay accessible to every user.
-- ============================================================================

drop policy "mvp full access" on public.projects;
drop policy "mvp full access" on public.rfis;
drop policy "mvp full access" on public.submittals;
drop policy "mvp full access" on public.change_orders;
drop policy "mvp full access" on public.activity_log;

create policy "authenticated full access" on public.projects
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "authenticated full access" on public.rfis
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "authenticated full access" on public.submittals
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "authenticated full access" on public.change_orders
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "authenticated full access" on public.activity_log
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
