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

## Setup

This is a new workspace. Install dependencies from the repo root once:

```bash
npm install
```

Copy env and set API base URLs (include `/api/v1` — same convention as
`VITE_IDENTITY_API_BASE_URL` / `VITE_API_BASE_URL` in other services).

**Local LAN:** point at your PC's LAN IP (not `localhost`), set `HOST=0.0.0.0` in
`identity/backend/.env` and `sms/backend/.env`, and use a **debug** build —
Android **release** APKs block cleartext HTTP.

**Production release:** use `https://` hosts (e.g. `https://identity.webonone.com/api/v1`).
`http://` Identity URLs work in debug but fail with "Network request failed" on release.

```bash
cp .env.example .env
# Local:  IDENTITY_API_BASE_URL=http://<lan-ip>:4011/api/v1
# Prod:   IDENTITY_API_BASE_URL=https://identity.webonone.com/api/v1
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
