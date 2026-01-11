-- Create enum for user roles
create type public.app_role as enum ('admin', 'teacher', 'class_teacher');

-- Create profiles table for user information
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    phone text,
    class_id text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view all profiles" 
on public.profiles for select 
to authenticated
using (true);

create policy "Users can update their own profile" 
on public.profiles for update 
to authenticated
using (auth.uid() = id);

create policy "Users can insert their own profile" 
on public.profiles for insert 
to authenticated
with check (auth.uid() = id);

-- Create user_roles table (separate from profiles for security)
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Security definer function to check roles (avoids RLS recursion) - MUST be created before policies
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Function to check if user is class teacher for a specific class
create or replace function public.is_class_teacher(_user_id uuid, _class_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles r on p.id = r.user_id
    where p.id = _user_id
      and p.class_id = _class_id
      and r.role = 'class_teacher'
  )
$$;

-- Function to get user's class_id if they are a class teacher
create or replace function public.get_teacher_class(_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.class_id
  from public.profiles p
  join public.user_roles r on p.id = r.user_id
  where p.id = _user_id
    and r.role = 'class_teacher'
  limit 1
$$;

-- NOW create policies for user_roles (after has_role function exists)
create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update roles"
on public.user_roles for update
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete roles"
on public.user_roles for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  
  -- Assign default role 'teacher'
  insert into public.user_roles (user_id, role)
  values (new.id, 'teacher');
  
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();