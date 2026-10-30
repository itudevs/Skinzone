-- Allow customers and staff to update the time lines when rescheduling a booking.

grant update (time) on table public.booking_line to authenticated;

drop policy if exists "Customers and staff can update booking lines"
on public.booking_line;

create policy "Customers and staff can update booking lines"
on public.booking_line
for update
to authenticated
using (
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
)
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
