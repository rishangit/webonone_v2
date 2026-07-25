# 01 — Overview (1.14.0)

## Vision

Signing in to WebOnOne feels like the rest of the platform: the user stays on **WebOnOne**, and Identity’s owned login UI appears in an **iframe** — the same connection style already used for Email, Data, Profile, and SMS. Identity still owns credentials and JWT issuance; WebOnOne never duplicates auth forms.

## User stories

1. As a **guest**, I open WebOnOne `/login` and see the Identity sign-in form **without** the browser navigating to the Identity origin.
2. As a guest, I complete email/password or Google sign-in **inside the iframe** and land on the WebOnOne home (or requested return path) signed in.
3. As a guest, I can open **Create account** or **Forgot password** inside the iframe; those pages stay framed and return me to embed login with the same `parentOrigin`.
4. As a **satellite / redirect consumer**, I can still use Identity `redirect_uri` + WebOnOne `/callback` auth-code exchange when a full-page OAuth redirect is required.

## Goals (1.14.0)

1. **Keep `/login`** — WebOnOne route remains the public login entry; no Identity top-level redirect as the primary path.
2. **Iframe host** — Load Identity `/login?parentOrigin=…&returnPath=…` in a full-area iframe.
3. **postMessage handoff** — On success, Identity posts `webonone:auth:success` with JWT + public user fields; WebOnOne validates origin and stores session.
4. **Embed-safe Identity** — No `window.top` / top-level redirect in embed mode; preserve `parentOrigin` across register/forgot.
5. **Theme channel A** — Parent applies guest/platform theme into the login iframe via `webonone:theme:apply`.
6. **Retain redirect OAuth** — `/callback` + exchange remain for non-iframe consumers.
7. **Rules sync** — Cursor rules describe iframe login as the WebOnOne primary path.

## Scope (1.14.0)

### In scope

- WebOnOne `LoginPage` iframe host + auth message listener
- Identity LoginPage embed branch (`parentOrigin`) → postMessage on success
- Query preservation for register / forgot-password in embed mode
- Theme apply into login iframe after load
- Optional shared types/helpers in `@webonone/platform-embed` (or keep `webonone-v2` `embed.types.ts`)
- Update `.cursor/rules/webonone-v2-project.mdc` (and Identity note if needed)

### Out of scope

- Local WebOnOne username/password forms
- Changing authenticated peer embeds (`PlatformServiceFrame` / `embed=platform`)
- Changing Email/Data/SMS/Profile auth-code **navigation** between satellites
- Removing `/callback` or Identity `POST /auth/code` + `/auth/exchange`
- Redesigning Identity AuthLayout / Google button UX
- Silent SSO / auto-login without user action
- Refresh-token or cookie cross-origin schemes

## Glossary

| Term | Definition |
|------|------------|
| **Embed login** | Identity `/login` with allowlisted `parentOrigin`; success via postMessage |
| **Redirect login** | Identity `/login` with `redirect_uri` + `state`; success via auth-code redirect |
| **Login iframe host** | WebOnOne `/login` page that only hosts the Identity iframe |
| **Auth success message** | `webonone:auth:success` with `accessToken`, `expiresIn`, `user` |
| **Channel A** | Theme via `postMessage` `webonone:theme:apply` ([1.2.0](../1.2.0/05-theme-propagation.md)) |

## Mode selection (Identity)

| Query | Mode | After login |
|-------|------|-------------|
| `parentOrigin` (allowlisted) | **Embed** | postMessage to parent |
| `redirect_uri` + `state` (allowlisted) | **Redirect** | auth-code → callback URL |
| Neither | **Standalone** | Stay on Identity (welcome / profile link) |

If both `parentOrigin` and `redirect_uri` are present, **prefer embed** when opened inside an iframe (detect `window.parent !== window` and valid `parentOrigin`). Spec default for WebOnOne host: send **only** `parentOrigin` + `returnPath` (no `redirect_uri`).

## Success criteria

1. `http://localhost:3010/login` address bar stays on WebOnOne origin throughout sign-in.
2. Identity login UI is visible in the iframe; credentials submit against Identity API.
3. Successful login stores WebOnOne auth session and navigates to `returnPath` (default `/`).
4. Register / forgot flows do not break out of the iframe or drop `parentOrigin`.
5. Redirect OAuth via `/callback` still works when Identity is opened with `redirect_uri`.
6. `event.origin` and `parentOrigin` allowlists are enforced; no `postMessage('*')`.
7. `npm run type-check` passes for WebOnOne and Identity workspaces touched.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.14.0 | 86eydjav3 | All docs |
| WebOnOne login iframe host | 86eydjavt | [02](./02-webonone-login-iframe-host.md) |
| Identity embed postMessage | 86eydjavx | [03](./03-identity-embed-login.md) |
| Contract + theme | 86eydjaw3 | [04](./04-auth-postmessage-contract.md) |
| Cursor rules update | 86eydjaw5 | [07](./07-implementation-plan.md) |
