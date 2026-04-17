-- Fix RLS recursion from 0001_admin.sql.
--
-- The SELECT/UPDATE policies on `profiles` queried `profiles` themselves,
-- which triggers Postgres recursive-RLS protection and silently returns
-- zero rows. Net effect: every user's own profile read returned null and
-- /admin 404'd because getAdmin() couldn't see is_admin.
--
-- Fix: a SECURITY DEFINER function bypasses RLS and is safe to call from
-- inside policies. Recreate the policies on top of it.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;

drop policy if exists "admins can read all profiles" on public.profiles;
create policy "admins can read all profiles" on public.profiles
  for select
  using ( public.is_admin(auth.uid()) );

drop policy if exists "admins can update is_admin" on public.profiles;
create policy "admins can update is_admin" on public.profiles
  for update
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );
