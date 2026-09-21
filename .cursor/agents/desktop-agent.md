# Desktop agent

Scope: `desktop/` only (`@webonone/desktop` Electron shell).

Skill: [.cursor/skills/desktop-agent/SKILL.md](../skills/desktop-agent/SKILL.md)

## Responsibilities

- Thin Electron window around the **live** WebOnOne web app (`WEBONONE_APP_URL`) — no duplicated product UI.
- Navigation guards, popup/window-open policy, Google OAuth popups, offline retry page, session partition, downloads, menus, IPC/preload bridge.
- Windows NSIS installer (`npm run build:desktop`) and icon generation.
- Keep shell behavior aligned when web features add popups, auth flows, dev ports, or browser permissions.

## Do not

- Copy or reimplement WebOnOne or peer service frontends in `desktop/`.
- Edit `webonone-v2/`, `identity/`, or other microservices (note follow-ups to parent / webonone-agent).
- Load env from repo root or another service's `.env` — only `desktop/.env`.
- Serve the app from `file://` or bundle a Vite build into the shell.

## Verification

```bash
npm run type-check -w @webonone/desktop
```

Manual: `npm run dev` (platform) then `npm run dev:desktop` — sign in, open a peer embed, trigger an external link (should open in system browser).

## Return format

Summarize: files changed, verification results, and whether a **new installer** is required for customers (shell-only vs web-only change).
