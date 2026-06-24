-- Repair an existing public.documents table created with an older schema.
-- Run in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid()
);

alter table public.documents add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.documents add column if not exists title text;
alter table public.documents add column if not exists file_path text;
alter table public.documents add column if not exists file_url text;
alter table public.documents add column if not exists status text default 'processing';
alter table public.documents add column if not exists total_pages int;
alter table public.documents add column if not exists created_at timestamptz default now();

update public.documents set status = 'processing' where status is null;
update public.documents set created_at = now() where created_at is null;

alter table public.documents alter column status set default 'processing';
alter table public.documents alter column status set not null;
alter table public.documents alter column created_at set default now();
alter table public.documents alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_status_check'
      and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents
      add constraint documents_status_check
      check (status in ('processing', 'ready', 'failed'));
  end if;
end;
$$;

create index if not exists documents_user_id_created_at_idx
  on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

drop policy if exists "Users can read their own documents" on public.documents;
create policy "Users can read their own documents"
  on public.documents for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own documents" on public.documents;
create policy "Users can insert their own documents"
  on public.documents for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own documents" on public.documents;
create policy "Users can update their own documents"
  on public.documents for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own documents" on public.documents;
create policy "Users can delete their own documents"
  on public.documents for delete to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
