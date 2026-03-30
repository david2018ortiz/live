-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('admin', 'model', 'client')) default 'client',
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- ROOMS
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references public.profiles(id) not null,
  title text,
  cover_url text,
  status text check (status in ('live', 'ended')) default 'live',
  created_at timestamptz default now(),
  ended_at timestamptz
);

alter table public.rooms enable row level security;

create policy "Rooms are viewable by everyone"
  on rooms for select
  using ( true );

create policy "Models can create rooms"
  on rooms for insert
  with check ( auth.uid() = host_id );

create policy "Models can update their own rooms"
  on rooms for update
  using ( auth.uid() = host_id );

-- ACCESS CODES
create table public.access_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  phone text not null,
  duration_minutes int not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  expires_at timestamptz,
  used_at timestamptz,
  is_active boolean default true
);

alter table public.access_codes enable row level security;

create policy "Admins can view and create codes"
  on access_codes for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Clients can view their own code usage (by phone match maybe? or just public check)"
  on access_codes for select
  using ( true ); -- Simplified for checking validity

-- MESSAGES
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Everyone in room can view messages"
  on messages for select
  using ( true );

create policy "Authenticated users can insert messages"
  on messages for insert
  with check ( auth.uid() = user_id );

-- STORAGE BUCKETS (Script to run in SQL Editor)
-- insert into storage.buckets (id, name, public) values ('covers', 'covers', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- TRIGGER FOR NEW USERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'client'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
