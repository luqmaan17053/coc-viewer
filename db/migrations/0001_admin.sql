-- Add admin flag to profiles and seed the two initial admin UIDs.
-- Apply by pasting into Supabase Studio → SQL Editor (no DDL via REST/anon).

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create index if not exists profiles_is_admin_idx
  on public.profiles (is_admin) where is_admin = true;

update public.profiles
  set is_admin = true
  where id in (
    '1df03238-e2e5-4f76-9462-423d89ba37b5',
    'e24d90c5-11e6-4342-a118-a0347c090b45'
  );

-- RLS: admins can read every row in profiles (for the admin user list).
-- Existing "users can read/update their own profile" policies are unchanged.
drop policy if exists "admins can read all profiles" on public.profiles;
create policy "admins can read all profiles" on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Admins can flip is_admin on any row (grant/revoke via /api/admin/users).
drop policy if exists "admins can update is_admin" on public.profiles;
create policy "admins can update is_admin" on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
