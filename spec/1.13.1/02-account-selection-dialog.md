# 02 — Account selection dialog

After WebOnOne receives a valid Identity JWT, the **account selection gate** runs **before** the main dashboard / role-aware shell is usable.

## Timing

```text
Identity login success
        │
        ▼
WebOnOne auth store has accessToken
        │
        ▼
SessionRoleGate: bootstrap assumable accounts
        │
        ├─ Only Default User ──► auto-apply Default User ──► load dashboard
        │
        └─ Super Admin and/or owned companies
                │
                ▼
         Choose account dialog (blocking)
                │
                ▼
         Continue → reissue JWT → selectionComplete → load dashboard
```

Do **not** render the normal AppShell content as usable until `selectionComplete` is true. Keep using the existing platform loading overlay pattern (`SessionRoleGate`).

## When to show the dialog

| Situation | Dialog |
|-----------|--------|
| No Super Admin **and** zero owned companies | **Hide** — auto Default User |
| Has Super Admin (companies optional) | **Show** |
| Has ≥1 owned company (Super Admin optional) | **Show** |

**Owned company** = Identity `company_admin` for that `company_id` and company `status` ∈ {`pending`, `approved`}. Rejected companies are excluded.

## Dialog chrome

| Item | Value |
|------|--------|
| Component | `CustomDialog` from `@webonone/ui-kit` |
| Title | **Choose account** (or equivalent: “Which account do you want to use?”) |
| Description | Short copy: select how to use WebOnOne for this session; choice lasts until logout |
| Size | `sizeWidth="medium"`, `sizeHeight="auto"` (or scroll body if many companies) |
| Dismiss | **Not** dismissible via overlay / Escape — must Continue |
| Footer | Primary **Continue** (disabled until a card is selected — Default User counts as selected on open) |

Reference: existing [`RoleSelectionDialog.tsx`](../../webonone-v2/frontend/src/features/session/components/RoleSelectionDialog.tsx); rename / retitle as needed for “account” wording.

## Selectable cards (required order)

List **all** of the following that apply, as selectable cards in one scrollable list:

| Order | Card | When included | Session payload |
|-------|------|---------------|-----------------|
| 1 | **Default User** | Always when dialog is shown | `platformRole: member`, `companyId: null` |
| 2 | **Super Admin** | User has Super Admin role | `platformRole: super_admin`, `companyId: null` |
| 3…N | **{Company name}** (subtitle: Company Owner) | Each owned company | `platformRole: company_admin`, `companyId: <id>` |

### Card UI

- Selectable surface (border / selected state) matching current role-selection cards.
- Title: account label (Default User / Super Admin / company name).
- Short description line (rights summary).
- Exactly one card selected at a time.
- **On open:** Default User is **pre-selected**.

### Do not list

- Per-company “Default User (Company X)” member options
- Rejected companies
- Companies where the user is only `member` (not owner) — out of scope for 1.13.1

## Continue behavior

1. Call Identity `POST /auth/session-role` with the selected `platformRole` + `companyId`.
2. Update auth token + user in the store.
3. Mark session role selection complete (`activeRole`, `activeCompanyId`).
4. Close dialog; allow dashboard / shell to load with nav for that role.

On error: keep dialog open; show inline error; re-enable Continue.

## Relationship to All Companies Login (1.13.0)

| Path | When |
|------|------|
| Choose account dialog | Once per login (bootstrap), before dashboard |
| All Companies → 3-dot → Login | After session started, switch into a company |

Both use the same reissue API. Mid-session Login must not re-open this bootstrap dialog unless the product later adds an explicit “switch account” entry that reuses it.

## Acceptance

1. Default-User-only login → no dialog → dashboard as Default User.
2. One owned pending company → dialog: Default User (selected) + that company; Continue as company → company-owner nav.
3. Two owned companies → both company cards + Default User.
4. Super Admin with no companies → dialog: Default User (selected) + Super Admin.
5. Super Admin with companies → Default User + Super Admin + company cards.
6. Dialog cannot be closed without Continue.
7. Shell stays behind loading/gate until selection completes.
