-- Standardize an older document_chunks.embedding column to vector(1536).
-- Existing embeddings are cleared because vectors cannot be safely resized.
-- Re-upload existing documents after running this migration.

create extension if not exists vector;

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

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

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
