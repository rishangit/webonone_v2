# 07 — Implementation Plan

Phased delivery for **1.13.3** on branch **`spec/1.13.3`**.

---

## Branch workflow

```bash
git checkout master   # or merge base that includes 1.13.1 session gate
git pull
git checkout -b spec/1.13.3
```

| Rule | Detail |
|------|--------|
| Base | Branch that includes 1.13.1 Choose account gate |
| Spec branch | `spec/1.13.3` |
| Scope | `webonone-v2/frontend` (session + Basic Settings + System Theme cleanup) |
| Backend | None required |
| Identity | None required |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.13.3/*` documentation
- [ ] Branch `spec/1.13.3`
- [ ] ClickUp parent + subtasks when tracking is required

---

## Phase 1 — Sticky account selection

**Goal:** [02-account-selection-persistence.md](./02-account-selection-persistence.md)

| Task | Detail |
|------|--------|
| Storage | Persist `selectionComplete` + `activeRole` + `activeCompanyId` with auth session lifetime |
| Hydrate | On boot with stored auth, restore session role → skip dialog |
| Reset | `loginSuccess` and `logout` clear sticky selection |
| Bootstrap | Only open gate dialog when selection not complete and `requiresAccountSelection` |
| Mid-session | All Companies Login + roleSelected continue to update + persist |

**Exit criteria:** Hard refresh after Continue does not reopen Choose account.

**Verify:** `npm run type-check -w webonone-v2-root`

---

## Phase 2 — Basic Settings Account tab

**Goal:** [03-basic-settings-page.md](./03-basic-settings-page.md), [04-account-tab.md](./04-account-tab.md)

| Task | Detail |
|------|--------|
| Page | Tabs Account \| Theme on `BasicSettingsPage` |
| Account panel | Selected account summary + Change |
| Dialog mode | Settings Change: dismissible; pre-select current account; Continue reissues |

**Exit criteria:** Account tab reflects session; Change works.

---

## Phase 3 — Basic Settings Theme tab

**Goal:** [05-theme-tab-appearance.md](./05-theme-tab-appearance.md)

| Task | Detail |
|------|--------|
| Appearance | Two selectable cards (Light/Sun, Dark/Moon) |
| Wire | Existing `patchPreferencesRequested({ colorMode })` |
| System Theme | Remove duplicate color-mode toggle (or link to Basic Settings) |

**Exit criteria:** Mode switches from Theme tab; persists; System Theme not duplicated.

---

## Acceptance checklist

- [ ] Multi-account login → Choose account once → refresh → no dialog; same account
- [ ] Logout → login → dialog again when multi-account
- [ ] Default-User-only still skips dialog
- [ ] Basic Settings shows Account + Theme tabs
- [ ] Account tab shows selected account; Change opens dialog; Continue updates
- [ ] Change Cancel keeps account
- [ ] Theme tab Light/Dark cards apply color mode
- [ ] System Theme duplicate appearance control removed or deferred
- [ ] Type-check green

---

## Open items

- ClickUp IDs when product tracking is required
- Optional `?tab=` deep links
- Optional promoting Radix tabs to `@webonone/ui-kit` (not required for this spec)
