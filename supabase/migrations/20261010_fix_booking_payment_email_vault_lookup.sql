-- Update the already-installed trigger function. Editing an applied migration
-- does not re-run it, so this must be a new migration.
create or replace function public.notify_payment_confirmation_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text := 'https://guognidjyfgmnielcewx.supabase.co';
  service_role_key text;
begin
  if lower(trim(coalesce(old.status, ''))) not in ('pending', '1')
     or lower(trim(coalesce(new.status, ''))) not in ('booked', '2') then
    return new;
  end if;

  select decrypted_secret
    into service_role_key
    from vault.decrypted_secrets
   where name in ('service_role_key', 'SUPABASE_SERVICE_ROLE_KEY')
   order by case when name = 'service_role_key' then 0 else 1 end
   limit 1;

  if nullif(trim(service_role_key), '') is null then
    raise warning 'service_role_key is not configured in Supabase Vault';
    return new;
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/payment_confirmation_email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('bookingid', new.bookingid)
  );

  return new;
end;
$$;
