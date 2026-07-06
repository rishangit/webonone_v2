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

Environment is pre-provisioned in the VM snapshot; the startup update script only runs `npm install`. The notes below are non-obvious caveats for running/verifying the stack — see the tables above and each service's `.env.example` for standard values.

### Database (MySQL)
- MySQL 8 is installed with `root` / `Mysql123!@@` (TCP `127.0.0.1:3306`). All five databases (`identity`, `webonone_v2`, `webonone_media`, `webonone_email`, `webonone_data`) are already created and migrated; the datadir persists in the snapshot.
- The daemon does **not** auto-start on boot. If any backend fails to connect, run `sudo service mysql start` (connect over TCP `127.0.0.1`; the unix socket dir is root-only).
- To re-apply schema after adding migrations: `npm run migrate:all` (or `npm run migrate:<service>`).

### Env files
- Each `<service>/backend/.env` and `<service>/frontend/.env` already exists (copied from `.env.example`, gitignored). `media/email/data` backends had an empty `DB_PASSWORD` in their examples — the local `.env` copies set it to `Mysql123!@@` to match MySQL. Recreate any missing `.env` by copying its `.env.example`.

### Verify / build gotchas
- Run `npm run build:packages` before `npm run type-check`: `tsc` resolves `@webonone/*` via each package's `dist/*.d.ts`, so a missing `dist/` causes `TS2307` in service frontends. Dev servers do **not** need this (Vite aliases packages to `src/`).
- Root `npm run type-check` and `npm run lint` fail only on **pre-existing** shared-package issues (`@webonone/platform-nav` `coreNav.test.ts` uses a `.ts` import extension; `@webonone/theme` has no `eslint.config.js`). All five runnable services pass both. Verify a single service with `npm run type-check -w <service>-root` / `npm run lint -w <service>-root`.

### Auth / registration in dev
- Login SSO: WebOnOne (`:3000`) redirects to Identity (`:3001/login`) and back. Test account: `founder@webonone.local` / `Password123!`.
- Registration is a 3-step email-OTP flow. SMTP (`smtp.privateemail.com`) is reachable and actually sends, but the plaintext OTP is easiest to read from `webonone_email.email_queue.payload_json` (`$.otp`). OTPs expire quickly — verify immediately after requesting.
