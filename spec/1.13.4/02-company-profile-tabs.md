# 02 — Company profile tabs

WebOnOne owns the **Company profile** page. **1.13.4** wraps the existing page body in two tabs without changing routes or page chrome ownership.

## Routes (unchanged)

| Actor | Route | Notes |
|-------|--------|--------|
| Member / owner | `/settings/companies/:companyId` | From All Companies |
| Super admin | `/companies/:companyId` | From Companies list |

One page component (`CompanyProfilePage`) remains mounted on both routes. Resolve `companyId` from `useParams`.

## Page chrome

| Item | Value |
|------|--------|
| Layout | `FeaturePage` from `@webonone/ui-kit` |
| Title | Company name when loaded; fallback **Company profile** while loading |
| Description | Short copy covering profile + media, e.g. “Update company details and gallery images.” |
| Loading | `usePlatformLoading('Loading company…')` |
| Not found / forbidden | `Alert` destructive; no tabs body |

### Header / back

- Back control unchanged: **Back to All Companies** / **Back to Companies**.
- Page-level Edit (if present today) applies to **Profile** card editing only — Gallery uses per-card upload actions, not a global Edit mode.

## Tabs

Use the same Radix tabs pattern as Basic Settings ([1.13.3/03](../1.13.3/03-basic-settings-page.md)) / UI Kit showcase.

| Tab id | Label | Content |
|--------|-------|---------|
| `profile` | **Profile** | [03 — Profile tab](./03-profile-tab.md) |
| `gallery` | **Gallery** | [04 — Gallery tab](./04-gallery-tab.md) |

### Defaults

- Default tab: **Profile**.
- Optional deep-link: `?tab=profile` \| `?tab=gallery` (nice-to-have; not required for v1).
- Switching tabs must not discard unsaved Profile edit state unless the user Cancels or leaves the page (prefer keep draft while on the page).

### Visual

- Tab list: compact segmented control matching Basic Settings / showcase.
- One panel visible at a time.
- Tab content uses FeaturePage vertical spacing (`space-y-6` / `gap-6` between cards).

## Composition

```text
FeaturePage
  title / description / back
  Tabs
    Profile  →  Card×3 (profile, contact, location)
    Gallery  →  Card (logo) + Card (gallery images)
```

## Acceptance

1. Both company routes show Profile and Gallery tabs after load.
2. Default tab is Profile with the existing three cards.
3. Switching to Gallery shows logo + gallery cards without remounting the whole FeaturePage chrome unnecessarily.
4. Unauthorized / not found states still hide editable content.
