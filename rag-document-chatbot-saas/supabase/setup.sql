-- Run this file once in Supabase Dashboard > SQL Editor for the project
-- referenced by server/SUPABASE_URL.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  stripe_customer_id text,
  plan text not null default 'free',
  monthly_question_limit int not null default 30,
  monthly_upload_limit int not null default 3,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_path text not null,
  file_url text,
  status text not null default 'processing',
  total_pages int,
  created_at timestamptz not null default now(),
  constraint documents_status_check check (status in ('processing', 'ready', 'failed'))
);

-- Reconcile older/incomplete documents tables.
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

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  page_number int,
  chunk_index int,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Reconcile older/incomplete document_chunks tables.
alter table public.document_chunks add column if not exists document_id uuid references public.documents(id) on delete cascade;
alter table public.document_chunks add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.document_chunks add column if not exists content text;
alter table public.document_chunks add column if not exists page_number int;
alter table public.document_chunks add column if not exists chunk_index int;
alter table public.document_chunks add column if not exists embedding vector(1536);
alter table public.document_chunks add column if not exists metadata jsonb default '{}';
alter table public.document_chunks add column if not exists created_at timestamptz default now();

update public.document_chunks set metadata = '{}' where metadata is null;
update public.document_chunks set created_at = now() where created_at is null;

alter table public.document_chunks alter column metadata set default '{}';
alter table public.document_chunks alter column metadata set not null;
alter table public.document_chunks alter column created_at set default now();
alter table public.document_chunks alter column created_at set not null;

-- Reconcile legacy vector dimensions before creating vector indexes/functions.
drop function if exists public.match_document_chunks(vector, uuid, uuid, integer);
drop index if exists public.document_chunks_embedding_idx;

do $$
begin
  if exists (
    select 1
    from pg_attribute attribute
    join pg_class relation on relation.oid = attribute.attrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'document_chunks'
      and attribute.attname = 'embedding'
      and not attribute.attisdropped
      and format_type(attribute.atttypid, attribute.atttypmod) <> 'vector(1536)'
  ) then
    update public.document_chunks set embedding = null where embedding is not null;
    alter table public.document_chunks
      alter column embedding type vector(1536)
      using null::vector(1536);
  end if;
end;
$$;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null,
  content text not null,
  citations jsonb not null default '[]',
  created_at timestamptz not null default now(),
  constraint messages_role_check check (role in ('user', 'assistant', 'system'))
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  tokens_used int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rag_evaluations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  question text,
  answer text,
  contexts jsonb,
  faithfulness numeric,
  answer_relevancy numeric,
  context_precision numeric,
  context_recall numeric,
  created_at timestamptz not null default now()
);

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
create index if not exists documents_user_id_created_at_idx
  on public.documents (user_id, created_at desc);
create index if not exists document_chunks_document_user_idx
  on public.document_chunks (document_id, user_id);
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
create index if not exists chats_user_document_created_at_idx
  on public.chats (user_id, document_id, created_at desc);
create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at asc);
create index if not exists usage_logs_user_action_created_at_idx
  on public.usage_logs (user_id, action, created_at desc);
create index if not exists rag_evaluations_document_created_at_idx
  on public.rag_evaluations (document_id, created_at desc);

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_document_id uuid,
  match_user_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  page_number int,
  chunk_index int,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.content,
    document_chunks.page_number,
    document_chunks.chunk_index,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from public.document_chunks
  where document_chunks.document_id = match_document_id
    and document_chunks.user_id = match_user_id
    and document_chunks.embedding is not null
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users created before the trigger existed.
insert into public.profiles (id, email, full_name)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name')
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.usage_logs enable row level security;
alter table public.rag_evaluations enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can read their own documents" on public.documents;
create policy "Users can read their own documents" on public.documents
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own documents" on public.documents;
create policy "Users can insert their own documents" on public.documents
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own documents" on public.documents;
create policy "Users can update their own documents" on public.documents
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own documents" on public.documents;
create policy "Users can delete their own documents" on public.documents
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read chunks for their own documents" on public.document_chunks;
create policy "Users can read chunks for their own documents" on public.document_chunks
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert chunks for their own documents" on public.document_chunks;
create policy "Users can insert chunks for their own documents" on public.document_chunks
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );
drop policy if exists "Users can update chunks for their own documents" on public.document_chunks;
create policy "Users can update chunks for their own documents" on public.document_chunks
  for update to authenticated using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );
drop policy if exists "Users can delete chunks for their own documents" on public.document_chunks;
create policy "Users can delete chunks for their own documents" on public.document_chunks
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read their own chats" on public.chats;
create policy "Users can read their own chats" on public.chats
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own chats" on public.chats;
create policy "Users can insert their own chats" on public.chats
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.documents
      where documents.id = chats.document_id and documents.user_id = auth.uid()
    )
  );
drop policy if exists "Users can update their own chats" on public.chats;
create policy "Users can update their own chats" on public.chats
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own chats" on public.chats;
create policy "Users can delete their own chats" on public.chats
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read messages in their own chats" on public.messages;
create policy "Users can read messages in their own chats" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id and chats.user_id = auth.uid()
    )
  );
drop policy if exists "Users can insert messages in their own chats" on public.messages;
create policy "Users can insert messages in their own chats" on public.messages
  for insert to authenticated with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id and chats.user_id = auth.uid()
    )
  );
drop policy if exists "Users can delete messages in their own chats" on public.messages;
create policy "Users can delete messages in their own chats" on public.messages
  for delete to authenticated using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id and chats.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read their own usage logs" on public.usage_logs;
create policy "Users can read their own usage logs" on public.usage_logs
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert their own usage logs" on public.usage_logs;
create policy "Users can insert their own usage logs" on public.usage_logs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can read evaluations for their own documents" on public.rag_evaluations;
create policy "Users can read evaluations for their own documents" on public.rag_evaluations
  for select to authenticated using (
    exists (
      select 1 from public.documents
      where documents.id = rag_evaluations.document_id
        and documents.user_id = auth.uid()
    )
  );
drop policy if exists "Users can insert evaluations for their own documents" on public.rag_evaluations;
create policy "Users can insert evaluations for their own documents" on public.rag_evaluations
  for insert to authenticated with check (
    exists (
      select 1 from public.documents
      where documents.id = rag_evaluations.document_id
        and documents.user_id = auth.uid()
    )
  );

-- Create the private PDF bucket used by the server.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

notify pgrst, 'reload schema';
