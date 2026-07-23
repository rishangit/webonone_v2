# 03 — Profile tab

The **Profile** tab is the 1.13.2 company profile body moved into the first tab. Behavior must remain the same; this doc only records what is preserved.

## Content (mandatory)

```text
Profile tab
  Card 1 — Company profile
  Card 2 — Contact information
  Card 3 — Location information
    Google Map + address
```

Full field rules, view/edit, validation, and map behavior: [../1.13.2/02-company-profile-page.md](../1.13.2/02-company-profile-page.md).

## Explicit non-goals on this tab

| Item | 1.13.4 rule |
|------|-------------|
| Logo upload UI | **Not** on this tab — owned by Gallery → Logo card |
| Gallery images | **Not** on this tab |
| New fields | None for 1.13.4 |

Optional: Profile card may **display** the current `logoUrl` as a small read-only thumbnail for identity context. If shown, it is display-only; changing the logo is always via the Gallery tab. Prefer **omit** logo on Profile card if it duplicates Gallery — default: **keep Profile cards exactly as today** (no logo block was required on the live card).

## Edit / save

- Same per-card or page-level edit mode as implemented for 1.13.2.
- Same PATCH payloads for profile / contact / location groups.
- Status remains display-only (`StatusTag`).

## Permissions

Unchanged from 1.13.2: members view; owners + super admins edit.

## Acceptance

1. Profile tab renders the three existing cards with current view/edit/save flows.
2. No regression to map, contact, or profile validation.
3. Logo/gallery management is not required to complete Profile saves.
