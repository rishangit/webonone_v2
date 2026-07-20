# 04 — Mobile app (1.12.0)

Expo (React Native + React Native Web) app. **v1 scope = login + SMS gateway configuration only.** Implements ClickUp subtask **TBD**.

## Stack decision (Path A)

The web microservices use `@webonone/ui-kit` (Radix + Tailwind DOM) which cannot render in React Native. Rather than migrate the web apps, the mobile app has its **own universal UI layer** and shares only tokens + RN-safe logic:

| Concern | Choice |
|---------|--------|
| Framework | **Expo** (TypeScript, Expo Router), **React Native Web** enabled |
| Build | Expo **dev/prebuild** build (not Expo Go) — needs native SMS module + foreground service |
| Styling | **NativeWind** (Tailwind syntax); `tailwind.config.js` extends `@webonone/theme` tokens |
| Components | **gluestack-ui** primitives, wrapped in `mobile/src/ui/` mirroring `@webonone/ui-kit` prop API (`variant`, `size`) |
| Shared code | `@webonone/store-kit`, Zod schemas, `mapZodIssuesToFieldErrors`, phone-country data (RN-safe) |
| Not shared | Any DOM / Radix / `react-dom` component |

## Folder layout

```text
mobile/
  package.json              # @webonone/mobile
  app.config.ts             # expo config + SEND_SMS permission + SMS module plugin
  metro.config.js           # monorepo watchFolders + nodeModulesPaths
  tailwind.config.js        # extends @webonone/theme tokens
  .env.example              # IDENTITY_API_BASE_URL, SMS_API_BASE_URL
  modules/
    sms-sender/             # local Expo Module — SmsManager + SubscriptionManager (Android)
  src/
    ui/                     # gluestack wrappers mirroring ui-kit API
    shared/
      services/apiClient.ts # Bearer injection, 401 handling
      services/smsApi.ts    # device register/heartbeat/messages/status
      store/                # redux-observable store (store-kit)
    features/
      auth/                 # login, JWT (expo-secure-store), session context
      sms-gateway/          # register, SIM select, foreground service, status/log
    navigation/             # bottom-tab + stack shell (v1: Home/status + Gateway)
```

## Config

`mobile/.env` via `expo-constants` / `app.config.ts` (v1 only):

```env
IDENTITY_API_BASE_URL=http://<lan-ip>:4010
SMS_API_BASE_URL=http://<lan-ip>:4016
```

Use the machine LAN IP (not `localhost`) so a physical phone reaches the dev backends. Other service bases are added when those features land.

## v1 user flow — login then configure

1. **Login** — email/password against Identity API; store JWT in `expo-secure-store`; `apiClient` injects `Authorization: Bearer` and logs out on 401. Read `platform_role` + `company_id` from claims.
2. **Configure gateway** — from the Gateway screen:
   - **Register this device** → `POST /device/register` (user JWT). Device `scope` is derived server-side from role: super_admin → **platform** (system SMS), company_admin → **company** (their SMS). Persist the returned one-time device key in `expo-secure-store`.
   - Show **approval-pending** until an admin approves the device in the SMS admin UI.
   - **Grant `SEND_SMS`** runtime permission; **select SIM** (multi-SIM via `SubscriptionManager`, show operator label); **enable gateway** (start the foreground service).

## Android gateway service

- Native module `modules/sms-sender` wraps `SmsManager.sendTextMessage` (or `getSmsManagerForSubscriptionId(subId)` for the chosen SIM). `SEND_SMS` declared via config plugin in `app.config.ts`.
- Foreground service + polling loop (interval, e.g. 5s):
  1. `GET /device/messages?max=N` (device key) → claim scoped pending rows.
  2. Send each via the selected SIM.
  3. `POST /device/messages/:id/status` with `sent` / `failed` (+ error, sim slot).
  4. Periodic `POST /device/heartbeat` (updates `last_seen_at`, `app_version`, `sim_slots`).
- Handle battery optimization / doze guidance so the service stays alive; surface a persistent notification while active.

## Screens (v1)

| Screen | Content |
|--------|---------|
| Login | Email/password; error states via gluestack + shared Zod |
| Home / status | Logged-in identity, role, device scope (platform/company), gateway on/off summary |
| Gateway | Register/approval status, SIM picker + operator label, permission prompts, enable/disable toggle, live sent/failed log |

## iOS

iOS cannot send SMS programmatically. iOS builds still log in and show a **"SMS gateway is Android-only"** state on the Gateway screen; no `SEND_SMS`/service code runs on iOS.

## Monorepo wiring

- Add `mobile` to root `workspaces`.
- Root scripts: `mobile` (`expo start`), `mobile:android` (`expo run:android`), `mobile:web` (`expo start --web`). Do **not** add to the root `dev` concurrently chain.
- `metro.config.js`: `watchFolders` = repo root; `nodeModulesPaths` include root `node_modules` so `@webonone/theme` / `@webonone/store-kit` resolve.

## Acceptance (subtask 3)

- [ ] Expo app builds; `mobile:web` renders login (RN Web sanity check)
- [ ] Login stores JWT; authenticated screen reachable
- [ ] Register device: scope derived from role; approval-pending shown until admin approves
- [ ] SIM selection lists SIMs with operator labels; `SEND_SMS` requested
- [ ] Foreground service polls, sends via SIM, reports status; heartbeat updates `last_seen_at`
- [ ] iOS shows Android-only gateway state; still logs in
- [ ] `mobile` type-checks; UI uses gluestack + NativeWind with `@webonone/theme` tokens
