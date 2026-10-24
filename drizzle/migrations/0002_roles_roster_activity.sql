-- Admin-only role management (user_roles has no client write policies)
create or replace function public.set_user_role(_user_id uuid, _role public.app_role, _grant boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only administrators can change roles' using errcode = '42501';
  end if;
  if _grant then
    insert into public.user_roles (user_id, role) values (_user_id, _role) on conflict do nothing;
  else
    if _role = 'admin' and (select count(*) from public.user_roles where role = 'admin') <= 1
       and exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin') then
      raise exception 'At least one administrator must remain';
    end if;
    delete from public.user_roles where user_id = _user_id and role = _role;
  end if;
  insert into public.activity_logs (actor_id, action, entity_type, entity_id)
  values (auth.uid(), (case when _grant then 'Granted ' else 'Removed ' end) || _role::text || ' role', 'user_roles', _user_id);
end $$;
revoke execute on function public.set_user_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role, boolean) to authenticated;

-- Team roster names for any signed-in user (names only, no emails)
create or replace function public.team_roster(_team_id uuid)
returns table (player_id uuid, full_name text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select tm.player_id, p.full_name, tm.joined_at
  from public.team_members tm join public.profiles p on p.id = tm.player_id
  where tm.team_id = _team_id and auth.uid() is not null
  order by p.full_name
$$;
revoke execute on function public.team_roster(uuid) from public, anon;
grant execute on function public.team_roster(uuid) to authenticated;

-- Automatic activity log
create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare rec jsonb; label text;
begin
  rec := to_jsonb(coalesce(new, old));
  label := coalesce(rec->>'name', '');
  if tg_table_name = 'player_registrations' and tg_op = 'UPDATE' then
    label := 'status ' || (rec->>'status');
  end if;
  insert into public.activity_logs (actor_id, action, entity_type, entity_id)
  values (
    auth.uid(),
    left(initcap(lower(tg_op)) || 'd ' || replace(tg_table_name, '_', ' ') || case when label <> '' then ' — ' || label else '' end, 200),
    tg_table_name,
    coalesce((rec->>'id')::uuid, (rec->>'team_id')::uuid)
  );
  return coalesce(new, old);
end $$;

create trigger sports_activity after insert or update or delete on public.sports for each row execute function public.log_activity();
create trigger teams_activity after insert or update or delete on public.teams for each row execute function public.log_activity();
create trigger team_members_activity after insert or delete on public.team_members for each row execute function public.log_activity();
create trigger matches_activity after insert or update or delete on public.matches for each row execute function public.log_activity();
create trigger registrations_activity after insert or update on public.player_registrations for each row execute function public.log_activity();