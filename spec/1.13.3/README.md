# WebOnOne Platform — Specification (1.13.3)

Extends [1.13.1](../1.13.1/README.md) by making the **Choose account** selection **sticky for the auth session** (no re-prompt on page refresh), and by filling **Settings → Basic Settings** with two tabs: **Account** (show / change selected account) and **Theme** (appearance: light / dark mode cards). Accent palette management stays on **System Theme**.

**Spec No:** 1.13.3

Implementation branch: **`spec/1.13.3`**

## What changed from 1.13.1 / 1.13.2

| Area | Before | 1.13.3 |
|------|--------|--------|
| Choose account on refresh | Dialog opens again whenever `SessionRoleGate` bootstraps and `requiresAccountSelection` is true | Dialog **only** at fresh login (or when user explicitly **Change**); refresh restores the selected account |
| Selected account UX | Selection lives only in memory until logout; no settings surface | **Basic Settings → Account** shows current account + **Change** |
| Light / dark mode | Color mode toggle on **System Theme** | **Basic Settings → Theme** Appearance card (two selectable cards: Light / Dark); System Theme keeps accent palettes |
| Basic Settings page | Empty / placeholder `FeaturePage` after 1.13.0 company cleanup | Two tabs: **Account**, **Theme** |

## Projects affected

| Project | Role in 1.13.3 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/`) | Persist session account selection; Basic Settings Account + Theme tabs; reuse Choose account dialog for Change |
| **WebOnOne backend** | No new APIs required (reuse assumable-roles + preferences `colorMode`) |
| **Identity** | No schema change — reuse `POST /auth/session-role` |
| **UI Kit** | Reuse `FeaturePage`, `Card`, `CustomDialog`, Radix tabs pattern (showcase) — no new primitive required |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-account-selection-persistence.md](./02-account-selection-persistence.md) | Once-per-login gate; restore on refresh; clear on logout / new login |
| [03-basic-settings-page.md](./03-basic-settings-page.md) | Basic Settings layout + Account / Theme tabs |
| [04-account-tab.md](./04-account-tab.md) | Selected account display + Change → Choose account dialog |
| [05-theme-tab-appearance.md](./05-theme-tab-appearance.md) | Appearance card: Light / Dark selectable cards |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.13.3 Account persistence + Basic Settings Account/Theme | TBD | All docs |
| Subtask: Persist chosen account across refresh | TBD | [02](./02-account-selection-persistence.md) |
| Subtask: Basic Settings Account tab + Change dialog | TBD | [03](./03-basic-settings-page.md), [04](./04-account-tab.md) |
| Subtask: Basic Settings Theme tab appearance cards | TBD | [05](./05-theme-tab-appearance.md) |

## Revision history

- **2026-07-23** — Initial spec: sticky account selection; Basic Settings Account + Theme (appearance) tabs.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.13.1/02-account-selection-dialog.md](../1.13.1/02-account-selection-dialog.md) | Choose account dialog UX and skip rules |
| [../1.13.1/03-assumable-roles-for-selection.md](../1.13.1/03-assumable-roles-for-selection.md) | Assumable-roles API for the gate |
| [../1.13.0/02-settings-all-companies-nav.md](../1.13.0/02-settings-all-companies-nav.md) | Settings nav (Basic Settings retained) |
| [../1.2.0/04-system-theme.md](../1.2.0/04-system-theme.md) | Preferences `colorMode` + System Theme palettes |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Dialogs | `.cursor/rules/dialog-windows.mdc` |
| Loading gate | `.cursor/rules/loading-empty-states.mdc` |
| Feature page | `.cursor/rules/feature-page-layout.mdc` |
| WebOnOne scope | `.cursor/rules/webonone-v2-project.mdc` |

## Local dev

```bash
npm run dev:webonone
npm run dev:identity
```

Manual test: multi-account login → Choose account → Continue → refresh page → **no** dialog; shell keeps the same account. Open Settings → Basic Settings → Account shows selection; Change re-opens dialog. Theme tab → pick Light / Dark cards; mode persists via preferences.
