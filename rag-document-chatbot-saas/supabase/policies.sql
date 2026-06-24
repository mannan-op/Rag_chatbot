alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.usage_logs enable row level security;
alter table public.rag_evaluations enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can read their own documents" on public.documents;
create policy "Users can read their own documents"
  on public.documents
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own documents" on public.documents;
create policy "Users can insert their own documents"
  on public.documents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own documents" on public.documents;
create policy "Users can update their own documents"
  on public.documents
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own documents" on public.documents;
create policy "Users can delete their own documents"
  on public.documents
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read chunks for their own documents" on public.document_chunks;
create policy "Users can read chunks for their own documents"
  on public.document_chunks
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert chunks for their own documents" on public.document_chunks;
create policy "Users can insert chunks for their own documents"
  on public.document_chunks
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update chunks for their own documents" on public.document_chunks;
create policy "Users can update chunks for their own documents"
  on public.document_chunks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete chunks for their own documents" on public.document_chunks;
create policy "Users can delete chunks for their own documents"
  on public.document_chunks
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own chats" on public.chats;
create policy "Users can read their own chats"
  on public.chats
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own chats" on public.chats;
create policy "Users can insert their own chats"
  on public.chats
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.documents
      where documents.id = chats.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own chats" on public.chats;
create policy "Users can update their own chats"
  on public.chats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own chats" on public.chats;
create policy "Users can delete their own chats"
  on public.chats
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read messages in their own chats" on public.messages;
create policy "Users can read messages in their own chats"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert messages in their own chats" on public.messages;
create policy "Users can insert messages in their own chats"
  on public.messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete messages in their own chats" on public.messages;
create policy "Users can delete messages in their own chats"
  on public.messages
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read their own usage logs" on public.usage_logs;
create policy "Users can read their own usage logs"
  on public.usage_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own usage logs" on public.usage_logs;
create policy "Users can insert their own usage logs"
  on public.usage_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read evaluations for their own documents" on public.rag_evaluations;
create policy "Users can read evaluations for their own documents"
  on public.rag_evaluations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents
      where documents.id = rag_evaluations.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert evaluations for their own documents" on public.rag_evaluations;
create policy "Users can insert evaluations for their own documents"
  on public.rag_evaluations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = rag_evaluations.document_id
        and documents.user_id = auth.uid()
    )
  );
