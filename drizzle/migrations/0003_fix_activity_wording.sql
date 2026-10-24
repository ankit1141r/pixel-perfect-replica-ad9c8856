create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare rec jsonb; label text; verb text;
begin
  rec := to_jsonb(coalesce(new, old));
  label := coalesce(rec->>'name', '');
  if tg_table_name = 'player_registrations' and tg_op = 'UPDATE' then
    label := 'status ' || (rec->>'status');
  end if;
  verb := case tg_op when 'INSERT' then 'Created' when 'UPDATE' then 'Updated' else 'Deleted' end;
  insert into public.activity_logs (actor_id, action, entity_type, entity_id)
  values (
    auth.uid(),
    left(verb || ' ' || replace(tg_table_name, '_', ' ') || case when label <> '' then ' — ' || label else '' end, 200),
    tg_table_name,
    coalesce((rec->>'id')::uuid, (rec->>'team_id')::uuid)
  );
  return coalesce(new, old);
end $$;