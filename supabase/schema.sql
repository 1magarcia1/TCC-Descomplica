create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('client', 'professional')),
  full_name text not null,
  email text not null,
  phone text not null default '',
  address text not null default '',
  registration_number text,
  specialty text,
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_registration_required check (
    role <> 'professional'
    or (registration_number is not null and length(trim(registration_number)) > 0)
  )
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, professional_id),
  check (client_id <> professional_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists conversations_client_updated_idx
  on public.conversations (client_id, updated_at desc);
create index if not exists conversations_professional_updated_idx
  on public.conversations (professional_id, updated_at desc);
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text := coalesce(new.raw_user_meta_data ->> 'role', 'client');
begin
  if selected_role not in ('client', 'professional') then
    raise exception 'Invalid account role';
  end if;

  insert into public.profiles (
    id, role, full_name, email, phone, address, registration_number,
    specialty, bio, avatar_url
  ) values (
    new.id,
    selected_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address', ''),
    nullif(trim(new.raw_user_meta_data ->> 'registration_number'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'specialty'), ''),
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.touch_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created_touch_conversation on public.messages;
create trigger on_message_created_touch_conversation
  after insert on public.messages
  for each row execute procedure public.touch_conversation_after_message();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.profiles, public.conversations, public.messages from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, address, registration_number, specialty, bio, avatar_url)
  on public.profiles to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

drop policy if exists "Users can read visible profiles" on public.profiles;
create policy "Users can read visible profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or role = 'professional'
    or exists (
      select 1
      from public.conversations c
      where (c.client_id = (select auth.uid()) or c.professional_id = (select auth.uid()))
        and (c.client_id = profiles.id or c.professional_id = profiles.id)
    )
  );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Clients can start conversations with professionals" on public.conversations;
create policy "Clients can start conversations with professionals"
  on public.conversations for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and exists (
      select 1 from public.profiles client
      where client.id = client_id and client.role = 'client'
    )
    and exists (
      select 1 from public.profiles professional
      where professional.id = professional_id and professional.role = 'professional'
    )
  );

drop policy if exists "Participants can read their conversations" on public.conversations;
create policy "Participants can read their conversations"
  on public.conversations for select to authenticated
  using (
    client_id = (select auth.uid())
    or professional_id = (select auth.uid())
  );

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.client_id = (select auth.uid()) or c.professional_id = (select auth.uid()))
    )
  );

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.client_id = (select auth.uid()) or c.professional_id = (select auth.uid()))
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('professional-avatars', 'professional-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload their own profile photo" on storage.objects;
create policy "Authenticated users can upload their own profile photo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'professional-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Authenticated users can update their own profile photo" on storage.objects;
create policy "Authenticated users can update their own profile photo"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'professional-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'professional-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Profile photos are publicly readable" on storage.objects;
create policy "Profile photos are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'professional-avatars');
