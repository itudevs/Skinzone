-- Allow signed-in customers and staff to add treatment lines to bookings.
-- The mobile app uses the publishable/anon key, so the authenticated role
-- needs both table privileges and an RLS insert policy.

grant insert on table public.booking_line to authenticated;

alter table public.booking_line enable row level security;

drop policy if exists "Customers and staff can insert booking lines"
on public.booking_line;

create policy "Customers and staff can insert booking lines"
on public.booking_line
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bookings
    where public.bookings.bookingid = booking_line.booking_id
      and (
        public.bookings.customerid = auth.uid()
        or exists (
          select 1
          from public."User" as app_user
          where app_user.id = auth.uid()
            and lower(coalesce(app_user.role, '')) = 'staff'
        )
      )
  )
);
