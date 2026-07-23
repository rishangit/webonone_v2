# 01 — Overview (1.13.3)

## Vision

After a user chooses an account in the post-login **Choose account** dialog, that choice is the active WebOnOne session until they log out or deliberately change it. Refreshing the browser must not ask again. **Settings → Basic Settings** is the place to see the current account, switch it, and set light / dark appearance — without digging through System Theme for everyday appearance.

## User stories

1. As a multi-account user, after I pick an account at login, refreshing any WebOnOne page keeps me on that account and does **not** show Choose account again.
2. As a signed-in user, on **Settings → Basic Settings → Account**, I see which account is active and can **Change** it (opens the same Choose account dialog).
3. As a signed-in user, on **Settings → Basic Settings → Theme**, I pick **Light** or **Dark** via two selectable appearance cards with icons.

## Goals (1.13.3)

1. **Once per login** — Choose account dialog only when starting a new auth session that still needs selection (same skip rules as 1.13.1 for Default-User-only).
2. **Sticky selection** — Persist selected account across full page reloads for the current auth session; restore `selectionComplete` + active role/company without re-prompt.
3. **Clear on auth boundary** — New Identity login and logout clear the sticky selection so the next login can prompt again when required.
4. **Basic Settings tabs** — Account | Theme.
5. **Account tab** — Show selected account; **Change** opens Choose account (dismissible Cancel when opened from settings; Continue reissues JWT).
6. **Theme tab** — Appearance card with Light and Dark selectable cards (icons); patch `colorMode` preferences. Accent palettes remain on System Theme.
7. **No Identity / BE schema changes** — Reuse existing session-role and preferences APIs.

## Scope (1.13.3)

### In scope

- WebOnOne session role persistence / restore on bootstrap
- Reset selection on `loginSuccess` and `logout`
- `BasicSettingsPage` Account + Theme tabs
- Account summary UI + Change → reuse Choose account dialog (settings entry mode)
- Theme Appearance Light/Dark selectable cards wired to existing preferences
- Optional: remove or slim duplicate Color mode control on System Theme (prefer single home on Basic Settings Theme; System Theme may keep a short link or omit duplicate toggle)

### Out of scope

- Header / sidebar account switcher chrome
- Changing 1.13.1 card list rules (Default User / Super Admin / owned companies)
- New Identity claims or role enums
- Moving System Theme accent palette CRUD onto Basic Settings
- Company registration / profile (1.13.0 / 1.13.2)

## Glossary

| Term | Definition |
|------|------------|
| **Auth session** | Period from successful Identity login (token stored) until logout or token clear |
| **Sticky account selection** | Persisted `activeRole` + `activeCompanyId` + `selectionComplete` for the auth session |
| **Fresh login** | `loginSuccess` after Identity callback / embed handoff — selection must run again if multi-account |
| **Account tab** | Basic Settings tab showing current session account |
| **Theme tab** | Basic Settings tab for appearance (light / dark) |
| **Appearance card** | UI section with two selectable Light / Dark mode cards |
| **Change account** | Explicit reopen of Choose account from Account tab |

## Success criteria

1. Multi-account user: Choose account once after login; refresh → no dialog; same account / nav.
2. Default-User-only: still no dialog (1.13.1 skip).
3. Logout → login again (multi-account) → dialog shows again.
4. Basic Settings has Account and Theme tabs.
5. Account tab shows the selected account label; Change opens Choose account; Continue updates session.
6. Theme tab Light/Dark cards update platform color mode (persisted preferences).
7. `npm run type-check -w webonone-v2-root` passes.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.13.3 | TBD | All docs |
| Subtask — Sticky account selection | TBD | [02](./02-account-selection-persistence.md) |
| Subtask — Account tab + Change | TBD | [03](./03-basic-settings-page.md), [04](./04-account-tab.md) |
| Subtask — Theme appearance cards | TBD | [05](./05-theme-tab-appearance.md) |
