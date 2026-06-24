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
