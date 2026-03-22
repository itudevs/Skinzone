-- Create password_reset_tokens table for storing OTP codes
-- Used for the forgot password flow

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token text not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for fast lookup by email and token
create index if not exists idx_password_reset_tokens_email_token
  on password_reset_tokens(email, token, used);

-- Create index for cleanup of expired tokens
create index if not exists idx_password_reset_tokens_expires_at
  on password_reset_tokens(expires_at);

-- Enable RLS
alter table password_reset_tokens enable row level security;

-- Policy: Only allow inserts from service role (edge functions)
create policy "Service role can insert password reset tokens"
  on password_reset_tokens for insert
  with check (auth.role() = 'service_role');

-- Policy: No direct reads from client (tokens should only be verified server-side)
create policy "Service role can update password reset tokens"
  on password_reset_tokens for update
  with check (auth.role() = 'service_role');

-- Optional: Add a trigger to auto-cleanup expired tokens
-- This prevents the table from growing unbounded
create or replace function public.cleanup_expired_password_reset_tokens()
returns void as $$
begin
  delete from password_reset_tokens
  where expires_at < now() - interval '1 day';
end;
$$ language plpgsql;

-- You can schedule this to run periodically using pg_cron extension if available
-- For now, expired tokens are just deleted on update attempts
