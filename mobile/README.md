# @webonone/mobile

WebOnOne platform mobile app (Expo + React Native + React Native Web).

**v1 scope:** login + SMS gateway configuration. A signed-in admin registers the
phone as a gateway; once an admin approves it in the SMS admin app, the phone
polls the SMS backend, sends queued messages over its SIM, and reports status.

## Stack

| Concern | Choice |
|--------|--------|
| Framework | Expo (TypeScript, Expo Router), React Native Web |
| Styling | NativeWind (Tailwind syntax); `tailwind.config.js` extends `@webonone/theme` tokens |
| UI layer | `src/ui/*` — NativeWind-styled RN primitives mirroring the `@webonone/ui-kit` prop API (`variant`, `size`). This is the gluestack-compatible universal layer; wrappers can be swapped to gluestack-ui primitives without changing screen code. |
| Shared code | `@webonone/store-kit`, `@webonone/theme`, Zod |
| Native | `modules/sms-sender` — Android `SmsManager` + `SubscriptionManager`, `SEND_SMS` |
| Auth | Identity login (email/password + Google on Android) → Choose account (Super Admin / Company Owner) → SMS `/me` |

## Setup

This is a new workspace. Install dependencies from the repo root once:

```bash
npm install
```

Copy env and set API base URLs (include `/api/v1` — same convention as
`VITE_IDENTITY_API_BASE_URL` / `VITE_API_BASE_URL` in other services).

**Local LAN:** point at your PC's LAN IP (not `localhost`), set `HOST=0.0.0.0` in
`identity/backend/.env`, `sms/backend/.env`, and `webonone-v2/backend/.env`, and use a
**debug** build — Android **release** APKs block cleartext HTTP.

**Production release:** use `https://` hosts (e.g. `https://identity.webonone.com/api/v1`).
`http://` Identity URLs work in debug but fail with "Network request failed" on release.

```bash
cp .env.example .env
# Local:  IDENTITY_API_BASE_URL=http://<lan-ip>:4011/api/v1
#         WEBONONE_API_BASE_URL=http://<lan-ip>:4010/api/v1
# Prod:   IDENTITY_API_BASE_URL=https://identity.webonone.com/api/v1
#         WEBONONE_API_BASE_URL=https://app.webonone.com/api/v1
```

### Role selection (Super Admin / Company Owner)

After login, the app loads WebOnOne `GET /company/me/assumable-roles`, keeps only
**Super Admin** and **Company Owner** options (no member/staff), then:

1. **One option** → auto Identity `POST /auth/session-role` → SMS `/me`
2. **Several** → Choose account screen → Continue → reissue JWT → SMS `/me`
3. **None** → blocked message (gateway is admin/owner only)

Company owners see company name + role on Home/Gateway (company SMS scope).
Super Admins see role only (platform / system SMS scope). Rebuild after changing
`WEBONONE_API_BASE_URL`.

### Google Sign-In (Android)

Uses the same Identity flow as the web app: native Google ID token →
`POST /api/v1/auth/google` → then the role selection step above.

1. In Google Cloud Console (same project as Identity), keep the existing **Web**
   OAuth client. Set `GOOGLE_WEB_CLIENT_ID` in `mobile/.env` to that client ID
   (same value as Identity `VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID`).
2. Create an **Android** OAuth client: package `com.webonone.sms`, plus SHA-1 for
   the Expo debug keystore (`mobile/android/app/debug.keystore`) and any release /
   Play App Signing key. The Android client ID is **not** stored in env.
3. Rebuild with `expo run:android` / prebuild. Google Sign-In does **not** work
   in Expo Go (native module). Leave `GOOGLE_WEB_CLIENT_ID` empty to hide the
   button. iOS and RN Web hide the button (out of scope for v1).

Debug SHA-1 (Expo project keystore):

```bash
keytool -list -v -alias androiddebugkey -keystore mobile/android/app/debug.keystore -storepass android -keypass android
```

## Run

```bash
npm run mobile          # expo start (from repo root)
npm run mobile:web      # RN Web sanity check
npm run mobile:android  # dev build on a connected Android device
npm run type-check -w @webonone/mobile
```

Sending real SMS requires a **dev/prebuild** build on a physical Android phone
(`expo run:android`) — Expo Go and emulators cannot send SMS. iOS logs in but
shows an "Android-only" gateway state.

## Notes / follow-ups

- The polling engine (`src/features/sms-gateway/useGateway.ts`) runs a JS loop
  (claim → send → report + heartbeat). `FOREGROUND_SERVICE*` permissions are
  declared in `app.config.ts`; a dedicated Android foreground service to keep the
  loop alive under Doze is a follow-up on top of this scaffold.
- The native module Kotlin sources under `modules/sms-sender/android` are wired
  via `expo prebuild`.
