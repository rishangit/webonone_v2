# 06 — Company owner role + Login from All Companies

Company registrants are **company owners**. Ownership is stored as Identity role `company_admin` for that `company_id`. From **Settings → All Companies**, each row’s **3-dot menu** exposes **Login** so the owner can enter that company session and receive company-owner rights.

## Product terms

| Term | Meaning | Stored value |
|------|---------|--------------|
| **Company Owner** | User-facing role for the registrant / administrator of a company | Identity `users_roles.role = company_admin` + `company_id` |
| **Login (to company)** | Switch the current WebOnOne session into that company as Company Owner | `POST` Identity `/auth/session-role` with `platformRole: company_admin`, `companyId` |
| **Default User** | Session without an active company (or membership-only) | `platformRole: member` |

Do **not** invent a new Identity enum value named `company_owner` in 1.13.0 — keep `company_admin` for compatibility with 1.6.0. UI copy on All Companies may say **Company Owner**.

## On company create (required)

When a user successfully `POST /company/register`:

1. Create `companies` row with `status = pending`.
2. Insert Identity `users_roles` for the registrant:
   - `role = company_admin` (**Company Owner**)
   - `company_id =` the new company id
3. Do **not** auto-switch the browser session into that company on register.
4. List row shows role as **Company Owner** and status **Pending**.

The user **has** the owner membership immediately; they can **Login** from All Companies while the company is **Pending** or **Approved** (not while **Rejected**) to exercise company-owner rights for that session.

## All Companies — 3-dot menu (required)

Every company row uses UI Kit `ItemListMenu` (item-list skill). Menu items:

| Item | When shown / enabled | Behavior |
|------|----------------------|----------|
| **Login** | Shown for rows where the user’s membership role is **Company Owner** (`company_admin`). **Enabled** when `status` is `pending` or `approved`. **Disabled** when `rejected`. | Assume that company for the current session (see below). |
| View details | Optional | Read-only summary; no status mutation |

**Forbidden on this menu:** Approve, Reject, Set pending (super-admin `/companies` only).

### Login behavior

1. User opens 3-dot → **Login** on a **pending** or **approved** company they own.
2. Client calls existing Identity session-role reissue:
   - `platformRole: 'company_admin'`
   - `companyId: <row company id>`
3. Store the new access token + update `sessionRole` (`activeRole`, `activeCompanyId`).
4. Shell nav switches to company-admin (`main`) variant — user now has **company owner rights** for that company (Email company scope, company-admin nav, etc.).
5. Toast optional: “Logged in to {companyName}”.

Reuse `sessionRoleApi.reissueSessionRole` / session role slice — do **not** invent a second auth path or put tokens in the URL.

### Disabled Login

| Status | Login |
|--------|--------|
| `pending` | Enabled for Company Owner |
| `approved` | Enabled for Company Owner |
| `rejected` | Disabled |

Members who are **not** Company Owner for that company do not get a Login-as-owner action in 1.13.0 (inviting / member login remains out of scope).

## Session role gate (relationship)

Existing post-login **Choose your role** dialog remains valid for users with multiple assumable roles. **Login** on All Companies is an **additional** way to switch into a company **after** the user is already in the app (especially when they started as Default User).

| Assumable roles API | Rule for 1.13.0 |
|---------------------|-----------------|
| `GET /company/me/assumable-roles` | Expose Company Owner (`company_admin`) options for **pending** and **approved** companies; omit **rejected**. |
| Rejected | Must **not** grant company-owner session via Login or role dialog. |

## Acceptance

1. Register company → Identity row is `company_admin` for that `company_id`; All Companies shows **Company Owner** + **Pending**.
2. Every owner row has a 3-dot menu; **Login** is present and **clickable** while Pending or Approved.
3. **Login** disabled only when Rejected.
4. Clicking **Login** reissues session as `company_admin` for that `companyId`; nav/rights match company owner.
5. No Approve/Reject on the All Companies menu.
6. No new Identity role enum; storage remains `company_admin`.
