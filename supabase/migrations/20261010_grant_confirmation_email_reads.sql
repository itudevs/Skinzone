-- The confirmation email Edge Function uses the service_role client to read
-- booking data after a customer creates a booking.
grant select on table public.bookings to service_role;
grant select on table public.booking_line to service_role;
grant select on table public."User" to service_role;
grant select on table public."Services" to service_role;
