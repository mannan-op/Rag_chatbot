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
