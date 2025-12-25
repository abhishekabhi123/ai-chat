create extension if not exists  "uuid-ossp";

create table if not exists conversations(
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now()
)


do $$ begin
  create type message_sender as enum ('user', 'ai');
exception
  when duplicate_object then null;
end $$;


create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender message_sender not null,
  message text not null,
  created_at timestamptz not null default now()
)

create index if not exists idx_messages_conversation_id_created_at on messages(conversation_id, created_at);