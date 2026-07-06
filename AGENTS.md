# Agent delegation map

This monorepo has five runnable services, a shared UI library, and shared contract packages under `packages/`. Each service has a **subagent** (`.cursor/agents/`) and a **skill** (`.cursor/skills/`). Agents and skills are scoped by service folder and `.cursor/rules/` — they do not depend on `spec/`.

**Orchestrator:** [.cursor/agents/platform-orchestrator.md](.cursor/agents/platform-orchestrator.md) · [skill](.cursor/skills/platform-orchestrator/SKILL.md)

## Shared packages (`packages/`)

Cross-service libraries that are **not** UI Kit and **not** microservices. See [packages/README.md](packages/README.md).

| Package | Purpose |
|---------|---------|
| `@webonone/platform-nav` | Cross-service redirect, auth-code handoff, return URL validation |
| `@webonone/media-embed` | Media iframe embed URL builder, postMessage types, React hooks |

Root: `npm run build:platform-nav`, `npm run build:media-embed`. Parent agent owns new entries under `packages/*`.

### Cross-cutting skills

| Skill | Description |
|-------|-------------|
| [form-creation](.cursor/skills/form-creation/SKILL.md) | Matching Zod validation on frontend + backend, required-field asterisks, inline errors via `@webonone/ui-kit` |
| [item-list](.cursor/skills/item-list/SKILL.md) | Gapped glass-card list rows, themed shadow hover, per-item 3-dot menus via `ItemList` primitives |

## Service agents

| Agent | Root | Subagent | Skill |
|-------|------|--------|-------|
| Identity | `identity/` | [identity-agent](.cursor/agents/identity-agent.md) | [skill](.cursor/skills/identity-agent/SKILL.md) |
| UI Kit | `ui-kit/` | [ui-kit-agent](.cursor/agents/ui-kit-agent.md) | [skill](.cursor/skills/ui-kit-agent/SKILL.md) |
| WebOnOne v2 | `webonone-v2/` | [webonone-agent](.cursor/agents/webonone-agent.md) | [skill](.cursor/skills/webonone-agent/SKILL.md) |
| Media | `media/` | [media-agent](.cursor/agents/media-agent.md) | [skill](.cursor/skills/media-agent/SKILL.md) |
| Data | `data/` | [data-agent](.cursor/agents/data-agent.md) | [skill](.cursor/skills/data-agent/SKILL.md) |

Company registration, memberships, platform roles, and super-admin approval are a **WebOnOne v2 feature** (backend + Basic Settings UI). See [spec/1.6.0](../spec/1.6.0/README.md).

## What the parent agent does

1. Classify which service roots the task affects.
2. Delegate to the matching subagent (or use the Task tool with the agent skill).
3. Keep root `package.json` / workspace wiring in the parent unless the task is service-only.
4. Merge subagent results and run verification.

## Dev commands (repo root)

| Command | Runs |
|---------|------|
| `npm run dev` | All five services |
| `npm run dev:identity` | Identity FE + BE |
| `npm run dev:ui-kit` | UI Kit showcase |
| `npm run dev:webonone` | WebOnOne FE + BE |
| `npm run dev:media` | Media FE + BE |
| `npm run dev:data` | Data FE + BE |
| `npm run build:platform-nav` | Build `@webonone/platform-nav` |
| `npm run build:media-embed` | Build `@webonone/media-embed` |

## Cursor Cloud specific instructions

The update script runs `npm install` only. Everything below is already provisioned in the VM snapshot; these are durable, non-obvious notes for running/testing the stack.

### Database (MySQL) — must be started each session
- MySQL is installed but not auto-started. Start it before any backend: `sudo service mysql start`.
- Local root credentials: user `root`, password `Mysql123!@@`, over TCP `127.0.0.1:3306` (the socket dir is root-only, so use `-h127.0.0.1`). These match the committed `backend/.env.example` values.
- Databases already created: `identity`, `webonone_v2`, `webonone_media`, `webonone_email`, `webonone_data`.
- `.env` files (one per `*/backend` and `*/frontend`) are copied from each `.env.example` and persist in the snapshot. The three that ship with a blank `DB_PASSWORD` (`media`, `email`, `data` backends) were set to `Mysql123!@@`. `.env` files are gitignored — recreate with `cp <svc>/<layer>/.env.example <svc>/<layer>/.env` if missing.

### Running / building
- Dev does **not** require `npm run build:packages` — each service `vite.config.ts` aliases workspace packages to their `src/`. Only run `build:packages` for production builds / full `npm run build`.
- Run `npm run migrate:all` after pulling changes that add new migrations (migrations are intentionally not in the update script). Migrations need the databases to already exist (they do).
- Start the full stack with `npm run dev` (FE ports 3000/3001/3002/3003/3004/3005, BE ports 4000/4001/4003/4004/4005). Backend health is at `/api/v1/health` (e.g. `curl http://localhost:4001/api/v1/health`), not `/health`.
- Login flow requires both Identity (`dev:identity`) and WebOnOne (`dev:webonone`); WebOnOne `/login` redirects to Identity and exchanges an auth code for a JWT.

### Testing the auth flow without an email inbox
- Registration uses a 4-digit email OTP with a **60-second** expiry, delivered via the Email service (real SMTP). To register end-to-end in dev without an inbox, read `otp_hash` from Identity DB table `registration_email_otps` (unsalted `sha256`) and reconstruct the 4-digit code, then call `/api/v1/auth/register/{request-email-otp,verify-email-otp,complete}`. Plain login (`/api/v1/auth/login`) needs no OTP.

### Pre-existing (not env) issues
- `npm run lint` fails only for `@webonone/theme` (has a `lint` script but no `eslint.config.js`).
- `npm run type-check` fails only for `@webonone/platform-nav` (test file `src/coreNav.test.ts` uses a `.ts` import extension). All five runnable services + UI Kit pass both.
