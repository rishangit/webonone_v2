# 03 — My Companies list UI

WebOnOne owns the **All Companies** page. Follow the **item-list** skill and UI Kit list-page demo (`ListPageDemo` in ui-kit showcase).

## Page

| Item | Value |
|------|--------|
| Route | `/settings/companies` |
| Component | `webonone-v2/frontend/src/features/settings/companies/pages/AllCompaniesPage.tsx` (preferred new feature folder) **or** under `settings/basic/` if co-locating with existing company code |
| Title | All Companies |
| Description | View and register companies you belong to on the platform. |

## Composition (mandatory)

```text
FeaturePage
  title / description
  actions: ListSearchField? + Add company Button
  ListPageBody
    flex-1 wrapper
      ItemList | ItemListEmpty
    Pagination className="mt-auto"
```

| Concern | Implementation |
|---------|----------------|
| Loading | `usePlatformLoading('Loading companies…')` — not inline loading text in `ItemListEmpty` |
| Empty | `ItemListEmpty` — e.g. “No companies yet. Add a company to get started.” |
| Primary CTA | `Button type="button" size="sm"` with leading `Plus` (`h-4 w-4`) **and** label **Add company** |
| Search | Optional `ListSearchField` in header actions (filter by name client-side is enough for v1) |
| Pagination | Client-side slice acceptable for v1 if API returns full membership list; pin with `mt-auto` |

### Add company

1. Click **Add company** → open existing `RegisterCompanyDialog` (3-step wizard from 1.6.0).
2. On successful submit → close dialog, show toast/callout: registration submitted; **admin approval is required**; company stays **Pending**; user is **Company Owner** for that company (`company_admin` in Identity).
3. Reload my-companies list — new row shows status badge **Pending** and role **Company Owner**.
4. User may open the dialog again to register another company while others are still **Pending**, **Approved**, or **Rejected**.
5. Session is **not** auto-switched into the new company; user uses 3-dot **Login** after approval ([06-company-owner-login.md](./06-company-owner-login.md)).

## Company status on the list (required)

Every row must surface exactly one of these statuses via UI Kit **`StatusTag`** (see [05-ui-kit-company-status-tags.md](./05-ui-kit-company-status-tags.md)):

| Status | When set | Who can change it | Tag |
|--------|----------|-------------------|-----|
| **Pending** | Immediately on client `POST /company/register` | Super admin only (via `/companies`) | `<StatusTag variant="pending" />` |
| **Approved** | Super admin chooses Approve | Super admin only | `<StatusTag variant="approved" />` |
| **Rejected** | Super admin chooses Reject | Super admin only | `<StatusTag variant="rejected" />` |

```text
Client register ──► pending ──► super admin Approve ──► approved
                         └──► super admin Reject  ──► rejected
                         └──► (optional) Set pending again
```

- Normal users **cannot** approve, reject, or edit status from All Companies.
- Until super admin acts, the company **must** remain `pending` (no auto-approve).
- **Do not** hand-roll status pill classes — use `StatusTag` only.

## List component

**File:** `…/components/MyCompaniesList.tsx`

Use only UI Kit primitives:

| Export | Use |
|--------|-----|
| `ItemList` | Container |
| `ItemListItem` | Row |
| `ItemListContent` | Name, `StatusTag`, role, optional logo |
| `ItemListMenu` | Row actions |
| `ItemListEmpty` | Empty state |
| `DropdownMenuItem` | Menu entries |
| `StatusTag` | Company status chip (`variant` = API status) |

### Row content

| Element | Detail |
|---------|--------|
| Logo | Thumbnail if `logoUrl`; otherwise muted placeholder |
| Name | Primary truncated title |
| Status | **Required** — `<StatusTag variant={status} />` (Pending / Approved / Rejected) |
| Role | **Company Owner** (`company_admin`) or Member — registrant always shows Company Owner |
| Meta (optional) | Created date |

### Row menu (1.13.0) — required 3-dot

Every row **must** include `ItemListMenu` (item-list skill). Primary action is **Login** so the company owner can enter that company from their user account.

| Action | When | Behavior |
|--------|------|----------|
| **Login** | Shown for **Company Owner** rows. **Enabled** when status is **Pending** or **Approved**. Disabled for **Rejected**. | Reissue session as `company_admin` for this `companyId` (Identity `/auth/session-role`); update token + `sessionRole`; user receives company owner rights for that company. See [06-company-owner-login.md](./06-company-owner-login.md). |
| View details | Optional | Expand inline or open read-only detail dialog with wizard field summary |
| Delete / leave | **Out of scope** | — |

Do not put Approve/Reject on this list — that remains on super-admin `/companies`.

## Basic Settings cleanup

| Before (1.6.0) | After (1.13.0) |
|----------------|----------------|
| No-company Callout + Register Company | Remove registration CTA from Basic Settings |
| Single company detail card | Remove or replace with short Callout: “Manage companies under **All Companies**.” + link |

Basic Settings may keep unrelated demos/settings (e.g. theme-adjacent tools) if already present; company registration is not owned there anymore.

## Store / data

Extend `companiesStore` (or a dedicated my-companies slice via `@webonone/store-kit` if a clean fit):

| State | Purpose |
|-------|---------|
| `myCompanies` | Array of company summaries for the signed-in user |
| `myCompaniesStatus` | loading / idle / error / saving |
| `myCompaniesFetchedAt` | Cache freshness |

Actions: load list, register (reuse existing register epic → then reload list).

## Acceptance

1. Page matches item-list skill visuals (gap, glass rows, hover shadow, **3-dot menu** on every row).
2. Multiple registrations appear as multiple rows, each starting as **Pending** `StatusTag` with role **Company Owner**.
3. Status always uses `StatusTag` for Pending / Approved / Rejected after super-admin action.
4. Empty and non-empty states both work; pagination stays at bottom with few rows.
5. Register wizard validation unchanged from 1.6.0; post-submit copy mentions approval required.
6. Super-admin Companies list remains separate (`CompaniesList` with Approve / Set pending / Reject) — also uses `StatusTag`; All Companies has no status-change menu items.
7. **Login** in the 3-dot menu works for Pending/Approved Company Owner rows → session becomes company owner for that company; disabled only when Rejected.
