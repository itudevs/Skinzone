-- Stores Expo push tokens per authenticated user device.
create table if not exists public.notification_tokens (
    id bigserial primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    expo_push_token text not null unique,
    platform text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    constraint notification_tokens_platform_check
        check (platform in ('ios', 'android', 'web'))
);

create unique index if not exists notification_tokens_user_token_idx
    on public.notification_tokens (user_id, expo_push_token);

create or replace function public.set_notification_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_notification_tokens_updated_at on public.notification_tokens;
create trigger set_notification_tokens_updated_at
before update on public.notification_tokens
for each row
execute function public.set_notification_tokens_updated_at();

alter table public.notification_tokens enable row level security;

-- No client RLS policies are added intentionally.
-- Writes/reads are performed through Edge Functions using service role credentials.
