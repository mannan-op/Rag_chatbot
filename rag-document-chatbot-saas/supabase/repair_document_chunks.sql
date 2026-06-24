-- Repair an existing public.document_chunks table created with an older schema.
-- Run in Supabase Dashboard > SQL Editor.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid()
);

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

-- An older installation may already have embedding as vector(384).
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

create index if not exists document_chunks_document_user_idx
  on public.document_chunks (document_id, user_id);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.document_chunks enable row level security;

drop policy if exists "Users can read chunks for their own documents" on public.document_chunks;
create policy "Users can read chunks for their own documents"
  on public.document_chunks for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert chunks for their own documents" on public.document_chunks;
create policy "Users can insert chunks for their own documents"
  on public.document_chunks for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update chunks for their own documents" on public.document_chunks;
create policy "Users can update chunks for their own documents"
  on public.document_chunks for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete chunks for their own documents" on public.document_chunks;
create policy "Users can delete chunks for their own documents"
  on public.document_chunks for delete to authenticated
  using (auth.uid() = user_id);

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
language sql
stable
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

notify pgrst, 'reload schema';
