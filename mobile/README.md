# @webonone/mobile

WebOnOne product app for phones (Expo + React Native + React Native Web).

Native **header** and **left drawer** use the same role-filtered nav as the web app (`@webonone/platform-nav`). SMS — including **This device** (Android SIM gateway) — lives under the SMS group, not as the whole app.

## Stack

| Concern | Choice |
|--------|--------|
| Framework | Expo (TypeScript, Expo Router), React Native Web |
| Styling | NativeWind; `tailwind.config.js` extends `@webonone/theme` tokens |
| UI | `@webonone/mobile-ui` — change a kit control once; every screen that imports it updates |
| Nav / roles | `@webonone/platform-nav` `buildNavDefsForSessionRole` (same Super Admin / owner / staff / default user as web) |
| Native SMS | `modules/sms-sender` — Android `SmsManager` |
| Auth | Identity login → Choose account (all assumable roles) → JWT |

## Setup

Install from the repo root:

```bash
npm install
```

Copy env:

```bash
cp .env.example .env
```

**Local LAN:** point API bases and origins at your PC's LAN IP (not `localhost`), set `HOST=0.0.0.0` on backends, and use a **debug** build — Android **release** APKs block cleartext HTTP.

Every `*_API_BASE_URL` should use the same environment as its matching `*_ORIGIN` when you rely on in-app WebViews. `IDENTITY_ORIGIN` and `WEBONONE_ORIGIN` are derived from their API bases when omitted. For Payment, Data, Email, and Media, you can set only `*_ORIGIN` — the app derives `{origin}/api/v1` when `*_API_BASE_URL` is omitted.

## Profile

**Profile** (header avatar menu → Profile) is a **native screen**. It calls Identity `GET /auth/me` with the app JWT — the same token used after login. It does not load Identity’s web UI in a WebView (that path stays blank on Android because production Identity only reads `localStorage` when the SPA boots).

**Payment → Invoices** is a native screen (list + detail, receipt upload, super-admin actions). It calls the Payment API (`PAYMENT_API_BASE_URL`) and Media API for receipt files (`MEDIA_API_BASE_URL`).

**Email** (Send, Queue, History, Templates — including template detail, preview, version history, and create/edit) is native — same admin screens as the web Email service, via `EMAIL_API_BASE_URL`.

**Identity → Users** (`IDENTITY_API_BASE_URL`) and **Staff** (`WEBONONE_API_BASE_URL`) are native — list, detail, search/filter, add user, and staff wizard — matching the web Identity and WebOnOne admin flows.

**Analytics** is a native screen. It calls WebOnOne `GET /company/me/analytics` (company accounts) or `GET /company/analytics/platform` (Super Admin) with the same date ranges, KPIs, and charts as the web Analytics page.

**Design** still uses an in-app WebView. After changing `.env`, restart Metro (`Ctrl+C`, then `npm run mobile` or `npm run mobile:android`).

## Accounts

After login the app loads WebOnOne `GET /company/me/assumable-roles` (Super Admin, company owner, staff, default user), then Identity `POST /auth/session-role`. The drawer matches that role. Switch accounts from the drawer footer when you have more than one.

SMS admin screens and **This device** appear only for Super Admin and company owners (same as web).

## SMS → This device (Android gateway)

1. Sign in as Super Admin or company owner.
2. Open **SMS → This device**.
3. Register the phone; approve it under **SMS → Devices** (app or web).
4. Grant `SEND_SMS`, pick a SIM, start the gateway.

iOS can sign in and use the rest of the app; the gateway step is Android-only. Text.lk mode does not need this phone.

## Run

```bash
npm run mobile          # expo start (from repo root)
npm run mobile:web      # RN Web sanity check
npm run mobile:android  # dev build on a connected Android device
npm run type-check -w @webonone/mobile
```

Sending real SMS requires a **dev/prebuild** build on a physical Android phone. Expo Go cannot send SMS.

## OS tray notifications (push)

In-app bell polling only runs while the app is open. Tray alerts when the phone is asleep or the app is killed use **Expo Push** (FCM on Android).

1. Create an Expo project (`npx eas init` in `mobile/`) and set `EXPO_PROJECT_ID` in `mobile/.env` (must match the project on expo.dev).
2. **FCM V1 on Expo (required for Android tray)** — see below. `google-services.json` in the app is not enough; Expo's push servers need the service account key uploaded on expo.dev.
3. Optional for production: set `EXPO_ACCESS_TOKEN` on the WebOnOne backend (from expo.dev access tokens).
4. Rebuild the native app after adding the `expo-notifications` plugin (`npm run mobile:android`). Expo Go cannot receive these pushes.
5. Sign in on a **physical** phone and allow notifications. Session due-to-start (and every other in-app notification) is delivered to the assigned staff user's tray.

### FCM V1 credentials (fix `InvalidCredentials` from Expo)

If [expo.dev/notifications](https://expo.dev/notifications) or your backend push returns:

`InvalidCredentials: Unable to retrieve the FCM server key for the recipient's app`

Expo does **not** have FCM configured for this Expo project yet.

1. **Firebase** — use the same project as `mobile/google-services.json` (e.g. `project_id: webonone`, package `com.webonone.mobile`).
   - [Firebase Console](https://console.firebase.google.com/) → Project settings → **Service accounts**.
   - **Generate new private key** (JSON). Keep it secret; do not commit.
2. **Expo** — [expo.dev](https://expo.dev) → your app → **Project settings** → **Credentials** → **Android**.
   - Under **FCM V1 service account key**, upload the Firebase JSON (not `google-services.json`).
   - Docs: [FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/).
3. Wait a minute, then resend from expo.dev/notifications with channel `webonone-alerts` and your `ExponentPushToken[...]` (app killed).
4. No app rebuild is required for the Expo upload alone; sign in again only if you change `EXPO_PROJECT_ID` or Firebase app.

Legacy **FCM server key** (Cloud Messaging API key) is deprecated; use **FCM V1 service account** only.

Dev-only **UI Kit** gallery: `/dev/kit` (also listed in the drawer in development).

## Notes

- Other web areas (Design, …) open in an in-app WebView or the browser until native screens exist. Adding a left-nav item in `packages/platform-nav` should get a mobile destination (native or WebView) in the same change.
- Gateway polling is a JS loop; a dedicated Android foreground service for Doze is a follow-up.
- Google Sign-In is Android-only and does not work in Expo Go.
