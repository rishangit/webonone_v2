---
name: desktop-agent
description: >-
  Desktop client agent for webonone-platform. Handles desktop/ Electron shell —
  live WebOnOne URL, navigation guards, OAuth popups, offline page, installer.
  Use when tasks touch desktop/, Electron, WEBONONE_APP_URL, or shell behavior
  for the Windows desktop app. Product agents must assess desktop impact on
  auth/popups/permissions; delegate shell changes here.
---

# Desktop agent skill

**Subagent:** [.cursor/agents/desktop-agent.md](../../agents/desktop-agent.md)

## Scope

**Allowed paths:** `desktop/` only.

**Do not edit:** `webonone-v2/`, `identity/`, peer services, or Support — report cross-service follow-ups to the parent.

## Rules

- [desktop-project.mdc](../../rules/desktop-project.mdc) — thin shell, env, security, parity checklist
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc)
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc) — shell is not a microservice; no shared DB

## Architecture (read first)

The desktop app is a **Chromium shell** that loads the same product as the browser. Feature UI ships in web frontends only. Users get new pages and workflows after **reload or reopen** — no installer rebuild.

Rebuild `WebOnOne-Setup.exe` only when **shell code** changes (Electron, guards, URL defaults, offline page, preload IPC, builder config).

Reference: [desktop/README.md](../../../desktop/README.md).

## When product changes need this agent

Other agents (especially **webonone-agent**, **identity-agent**) must run the checklist below. If any item applies, return `Desktop shell: follow-up` with bullets; parent delegates **desktop-agent** in the same task.

| Trigger | Typical shell work |
|---------|-------------------|
| New `window.open` / popup auth (non-Google) | Allow in-app popup or open externally in `main.ts` / `origins.ts` |
| Google Sign-In / OAuth URL patterns | Extend `isGoogleOAuthUrl` or popup handler |
| Auth-code redirect to **another origin** in dev | Ensure port in `LOCAL_FRONTEND_PORT_MIN`–`MAX` (`origins.ts`) or document `WEBONONE_APP_URL` |
| New browser permission (notifications, mic, etc.) | `setPermissionRequestHandler` in `main.ts` |
| Download / save-as behavior | `will-download` handler |
| Offline / network error UX | `offlinePage.ts`, `desktop:retry` preload IPC |
| Native bridge for web (`window.webononeDesktop`) | `preload.ts` + `ipcMain` in `main.ts` |
| Production app host change | `config.ts` defaults, deploy docs, Support only if user-facing URL instructions change |

If none apply, return `Desktop shell: no change — web deploy only`.

## Key files

| Concern | File |
|---------|------|
| Window, guards, menu, session | `desktop/src/main.ts` |
| Allowed origins / popups | `desktop/src/origins.ts` |
| App URL + `desktop/.env` | `desktop/src/config.ts` |
| Offline data URL + retry UI | `desktop/src/offlinePage.ts` |
| Preload bridge | `desktop/src/preload.ts` |
| Installer | `desktop/package.json` (`electron-builder`) |

## Env

`desktop/.env` only (see `desktop/.env.example`).

| Variable | Purpose |
|----------|---------|
| `WEBONONE_APP_URL` | Full URL of WebOnOne FE (default dev `http://127.0.0.1:3010`, packaged prod `https://app.webonone.com`) |

## Security (do not regress)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Partition `persist:webonone` for persistent login
- Main-frame navigation limited to app origin (+ local dev FE ports when unpackaged)
- External http(s) links → system browser unless explicitly allowed as in-app popup
- No `file://` app loading

## Verification

```bash
npm run type-check -w @webonone/desktop
```

Manual:

1. Repo root: `npm run dev`
2. `npm run dev:desktop`
3. Sign in (Identity iframe + Google if used)
4. Open a shell peer (Email/Data) and a link that should open externally (Help)
5. Disconnect network briefly → offline page → Retry

Installer smoke (when shell changed):

```bash
npm run build:desktop
```

## Production publish (WebOnOne IIS)

The download link is `{app origin}/downloads/WebOnOne-Setup.exe`. **`npm run deploy -w webonone-v2-root`** runs `build:desktop` and `tooling/stage-iis-deploy.mjs` copies `desktop/release/WebOnOne-Setup.exe` into `webonone-v2/deploy/public/downloads/`.

Verify after deploy:

```bash
curl -I https://app.webonone.com/downloads/WebOnOne-Setup.exe
```

Expect a large `Content-Length` and **not** `Content-Type: text/html`. If you see HTML, the installer was never staged — redeploy with the steps above.

## Return format

Summary, files touched, verification results, **`Installer rebuild: required | not required`**, and any Support/docs note if user-facing install or URL guidance changed.
