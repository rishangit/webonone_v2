# 03 — Basic Settings page

**Route:** `/settings/basic` (existing nav item **Basic Settings**).

After 1.13.0 moved company registration to All Companies, Basic Settings is an empty shell. **1.13.3** fills it with two tabs for session and appearance settings.

## Page chrome

| Item | Value |
|------|--------|
| Layout | `FeaturePage` from `@webonone/ui-kit` |
| Title | **Basic Settings** |
| Description | Short copy, e.g. “Manage your active account and appearance.” |
| Body | Tabbed content — **Account** | **Theme** |

## Tabs

Use the same Radix tabs pattern as the UI Kit showcase (`PagesPage` / nested tabs): list + triggers + content panels. No new UI Kit export required unless the team later promotes a shared `Tabs` primitive.

| Tab id | Label | Content |
|--------|-------|---------|
| `account` | **Account** | [04 — Account tab](./04-account-tab.md) |
| `theme` | **Theme** | [05 — Theme tab appearance](./05-theme-tab-appearance.md) |

### Defaults

- Default tab: **Account**.
- Optional: remember last tab in `sessionStorage` for the page visit (not required).
- Deep-link optional: `?tab=account` \| `?tab=theme` (nice-to-have; not required for v1).

### Visual

- Tab list: compact segmented control (muted track, active trigger elevated) matching showcase style.
- One tab content visible at a time.
- Content uses standard FeaturePage vertical spacing (`space-y-6` / card gaps per feature-page rules).

## What stays elsewhere

| Concern | Where |
|---------|--------|
| Accent theme palettes (CRUD) | **Settings → System Theme** |
| All Companies / register | **Settings → All Companies** |
| Choose account at login | Session gate (not this page) |

## Acceptance

1. Navigating to Basic Settings shows Account and Theme tabs.
2. Switching tabs swaps content without leaving the route.
3. Page still uses `FeaturePage` and platform loading patterns when fetching preferences / roles.
