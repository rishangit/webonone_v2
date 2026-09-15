# @webonone/desktop

Native Windows app for WebOnOne. This is a **thin Electron shell** that loads the live web product in a Chromium window. It is **not** a microservice and does **not** copy feature UI.

Future website deploys appear in this app automatically after the user reopens or refreshes the window. Rebuild the installer only when the shell itself changes (window behavior, app URL, Electron upgrades).

## Setup

From the repo root:

```bash
npm install
cp desktop/.env.example desktop/.env
```

`WEBONONE_APP_URL` defaults to `http://127.0.0.1:3010` when unpackaged, and `https://app.webonone.com` in the production installer.

## Run (local)

Start the platform first (`npm run dev` from the repo root), then:

```bash
npm run dev:desktop
```

Or from this folder: `npm run start`.

## Installer

```bash
npm run build:desktop
```

Output: `desktop/release/WebOnOne-Setup.exe` (Windows x64 NSIS). Unsigned builds are expected for internal / customer beta until a signing cert is added.

Regenerate the app icon: `npm run icon -w @webonone/desktop` (writes `desktop/resources/icon.png`).

## Security

- `contextIsolation`, no `nodeIntegration`, `sandbox`
- Persistent session partition `persist:webonone` (login survives restart)
- Main-frame navigation stays on the WebOnOne app origin (local frontend ports in unpackaged mode)
- Google Sign-In popups are allowed; other http(s) links open in the system browser
- Downloads go to the user Downloads folder

Do not load `file://` of a Vite build — Identity login and peer iframes require a real http(s) origin.
