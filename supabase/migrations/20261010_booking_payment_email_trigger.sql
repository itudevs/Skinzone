-- Store the service-role key in Supabase Vault before enabling this trigger:
-- select vault.create_secret('key', 'service_role_key');
--
-- Deploy the function with JWT verification disabled because PostgreSQL invokes it:
-- supabase functions deploy payment_confirmation_email --no-verify-jwt

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
   where name = 'service_role_key'
   limit 1;

  if service_role_key is null then
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

drop trigger if exists booking_payment_confirmation_email on public.bookings;

create trigger booking_payment_confirmation_email
after update of status on public.bookings
for each row
when (
  lower(trim(coalesce(old.status, ''))) in ('pending', '1')
  and lower(trim(coalesce(new.status, ''))) in ('booked', '2')
)
execute function public.notify_payment_confirmation_email();
