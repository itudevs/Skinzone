# Remote Push Notifications Setup

This project now supports cross-device visit notifications using Supabase Edge Functions + Expo Push.

## 1) Create database table

Run the SQL in `supabase/notification_tokens.sql` in your Supabase SQL editor.

## 2) Deploy Edge Functions

From `SkinzoneProject`, run:

```bash
supabase functions deploy register-push-token
supabase functions deploy send-visit-notification
```

## 3) Ensure function secrets exist

Supabase Edge Functions need these built-in secrets (usually available by default):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Verify app config

`app.json` already includes `expo.extra.eas.projectId`, which is required for Expo push token registration.

## 5) Test flow

1. Log in as customer on Device A and open app (this registers token).
2. Log in as staff/admin on Device B.
3. Add a visit for that same customer.
4. Device A should receive a push notification immediately.

## Notes

- Push tokens are stored per device, so one user can receive notifications on multiple devices.
- If Expo reports invalid tokens, the function marks those tokens as inactive.
