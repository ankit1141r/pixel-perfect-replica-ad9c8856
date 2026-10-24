create type public.app_role as enum ('admin', 'player');
create type public.registration_status as enum ('pending', 'approved', 'rejected');
create type public.match_status as enum ('scheduled', 'live', 'completed', 'cancelled');
create type public.sync_status as enum ('not_configured', 'pending', 'synced', 'failed');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 100),
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (full_name, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own profile, admins read all" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "Users read own roles, admins read all" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- signup trigger: always player; the very first account becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_first boolean;
begin
  select not exists (select 1 from public.user_roles where role = 'admin') into is_first;
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(nullif(trim(left(new.raw_user_meta_data->>'full_name', 100)), ''), split_part(new.email, '@', 1)), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'player');
  if is_first then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- sports
create table public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 500),
  created_at timestamptz not null default now()
);
grant select on public.sports to authenticated;
grant insert, update, delete on public.sports to authenticated;
grant all on public.sports to service_role;
alter table public.sports enable row level security;
create policy "Signed-in read sports" on public.sports for select to authenticated using (true);
create policy "Admins manage sports" on public.sports for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  sport_id uuid not null references public.sports(id) on delete cascade,
  description text check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  unique (sport_id, name)
);
create index teams_sport_idx on public.teams(sport_id);
grant select, insert, update, delete on public.teams to authenticated;
grant all on public.teams to service_role;
alter table public.teams enable row level security;
create policy "Signed-in read teams" on public.teams for select to authenticated using (true);
create policy "Admins manage teams" on public.teams for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- team members
create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, player_id)
);
create index team_members_player_idx on public.team_members(player_id);
grant select, insert, update, delete on public.team_members to authenticated;
grant all on public.team_members to service_role;
alter table public.team_members enable row level security;
create policy "Signed-in read memberships" on public.team_members for select to authenticated using (true);
create policy "Admins manage memberships" on public.team_members for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  scheduled_at timestamptz not null,
  venue text check (char_length(venue) <= 120),
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status public.match_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);
create index matches_sport_idx on public.matches(sport_id);
create index matches_scheduled_idx on public.matches(scheduled_at);
create index matches_status_idx on public.matches(status);
grant select, insert, update, delete on public.matches to authenticated;
grant all on public.matches to service_role;
alter table public.matches enable row level security;
create policy "Signed-in read matches" on public.matches for select to authenticated using (true);
create policy "Admins manage matches" on public.matches for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.validate_match_teams()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.teams where id = new.home_team_id and sport_id = new.sport_id)
     or not exists (select 1 from public.teams where id = new.away_team_id and sport_id = new.sport_id) then
    raise exception 'Both teams must belong to the selected sport';
  end if;
  return new;
end $$;
create trigger matches_validate_teams before insert or update on public.matches
  for each row execute function public.validate_match_teams();

-- registrations
create table public.player_registrations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  status public.registration_status not null default 'pending',
  sheets_sync_status public.sync_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, sport_id)
);
create index registrations_status_idx on public.player_registrations(status);
grant select, insert, update, delete on public.player_registrations to authenticated;
grant all on public.player_registrations to service_role;
alter table public.player_registrations enable row level security;
create policy "Players read own registrations, admins all" on public.player_registrations for select to authenticated
  using (player_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Players create own pending registration" on public.player_registrations for insert to authenticated
  with check (player_id = auth.uid() and status = 'pending' and sheets_sync_status = 'pending');
create policy "Admins update registrations" on public.player_registrations for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete registrations" on public.player_registrations for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- activity log
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) <= 200),
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);
create index activity_created_idx on public.activity_logs(created_at desc);
grant select, insert on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;
create policy "Admins read activity" on public.activity_logs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins write activity" on public.activity_logs for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') and actor_id = auth.uid());

-- sheets sync jobs
create table public.sheets_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.player_registrations(id) on delete cascade,
  status public.sync_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.sheets_sync_jobs to authenticated;
grant all on public.sheets_sync_jobs to service_role;
alter table public.sheets_sync_jobs enable row level security;
create policy "Admins read sync jobs" on public.sheets_sync_jobs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update sync jobs" on public.sheets_sync_jobs for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- queue a sync job for every new registration
create or replace function public.queue_registration_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.sheets_sync_jobs (registration_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger registrations_queue_sync after insert on public.player_registrations
  for each row execute function public.queue_registration_sync();

insert into public.sports (name, description) values
  ('Cricket', 'Bat-and-ball team sport.'),
  ('Football', 'Association football.'),
  ('Basketball', 'Five-a-side court game.'),
  ('Badminton', 'Racquet sport, singles and doubles.'),
  ('Volleyball', 'Six-a-side net sport.');