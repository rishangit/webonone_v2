# 04 — Account tab

**Basic Settings → Account** shows the **currently selected session account** and lets the user change it without logging out.

## Layout

One primary **card** (or glass summary panel) inside the Account tab:

| Element | Content |
|---------|---------|
| Title | **Selected account** (or “Current account”) |
| Body | Account label + short description |
| Action | **Change** button |

### Account label resolution

Derive display from `sessionRole.activeRole` + `activeCompanyId` (+ assumable roles labels when available):

| Active state | Label | Description (example) |
|--------------|-------|------------------------|
| `member`, no company | **Default User** | Standard user account for this session |
| `super_admin` | **Super Admin** | Platform operator… |
| `company_admin` + company id | **{Company name}** | Company Owner… |

If company name is not in memory, show a loading line or fetch assumable roles / my-companies once to resolve the name. Prefer matching Choose account card copy from 1.13.1.

## Change account

1. User clicks **Change**.
2. Open the existing **Choose account** dialog in **Settings Change** mode ([02](./02-account-selection-persistence.md)).
3. Pre-select the **currently active** account card (not Default User unless that is active).
4. Load the same assumable roles list as the login gate (`GET /company/me/assumable-roles` / cached `assumableRoles`).
5. **Continue** → reissue session role → update auth token → persist sticky selection → close dialog → refresh Account tab summary.
6. **Cancel** / dismiss → keep current account; no JWT change.

### When Change is unavailable

| Situation | Behavior |
|-----------|----------|
| User is Default-User-only (`requiresAccountSelection` false / single Default User) | Hide **Change**, or disable with helper text “Only one account is available.” |
| Bootstrap still loading | Disable Change until selection + roles ready |

## Relationship to login gate

| Entry | Pre-select | Dismissible |
|-------|------------|-------------|
| Login gate | Default User | No |
| Settings Change | Current account | Yes |

Same dialog component; mode prop or open-source flag controls dismissibility and initial selection.

## Acceptance

1. After choosing Company A at login, Account tab shows Company A.
2. Change → dialog lists same cards as login; current card selected.
3. Continue as Super Admin → Account tab updates; nav matches Super Admin.
4. Cancel Change → account unchanged.
5. Default-User-only user sees Default User without a misleading multi-account Change flow.
