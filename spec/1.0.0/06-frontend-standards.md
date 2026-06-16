# 06 — Front-end Standards

Applies to **identity/frontend**, **webonone-v2/frontend**, **ui-kit/showcase**, and **ui-kit/package**.

Authoritative rules: `front-end-structure.mdc`, `react-typescript.mdc`, `tailwind-css.mdc`, `redux-store-and-epics.mdc`, `code-cleanliness.mdc`.

## Structure (Identity & WebOnOne frontends)

```text
src/
  app/           # store, router, App.tsx
  features/      # domain modules
  shared/        # cross-feature barrels, apiClient
  layouts/
  main.tsx
```

Each feature: `components/`, `pages/`, `services/`, `store/`, `hooks/`, `types/`, `schemas/`, `index.ts`.

- Features must not import other features directly — use `@/shared/` barrels.
- App shell (`app/`, `layouts/`, `main.tsx`) may wire features.

## UI Kit usage

```tsx
import { Button, Input, AuthLayout, PageShell } from '@webonone/ui-kit'
import '@webonone/ui-kit/styles'
```

- **Identity**: all form UI from UI Kit.
- **WebOnOne v2**: layout from UI Kit; login UI only inside Identity iframe.
- **Showcase**: imports from local package for demos.

## State (Identity & WebOnOne)

- Single store in `app/store/`.
- Slices and epics in `features/<domain>/store/`.
- Async via redux-observable epics only (`redux-store-and-epics.mdc`).
- WebOnOne auth slice stores token received from iframe `postMessage`.

## Iframe-related code placement

| Code | Project |
|------|---------|
| `LoginPage` embed mode, `useEmbedMode`, `LoginForm`, postMessage **send** | Identity |
| `IdentityLoginFrame`, postMessage **receive** | WebOnOne v2 |
| `AuthLayout`, `Button`, `Input` | UI Kit |

Identity uses **one route per auth screen** (`/login`, `/register`, etc.). Embed mode is toggled by `parentOrigin` query param — no separate `/embed/*` routes or page files.

Cross-service connection: [07-identity-webonone-integration.md](../../spec/1.0.0/07-identity-webonone-integration.md).

## Verification

```bash
npm run type-check
npm run lint
```

Run from each frontend and from `ui-kit/package`.
