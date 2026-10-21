# Feedback 0050 — Company status needs improvement

| Field | Value |
|-------|-------|
| Ticket | `0050` |
| Feedback id | `qijF17qkpFEtbpkMNuB-R` |
| Type | `feature` |
| Title | Company status needs improvement |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

New companies are created as **Pending** and a super admin can approve them immediately. Registration should stay in setup first: status **Draft**, then the owner requests approval (**Pending**), and a super admin approves that request.

## Problem / goal

**Problem:** Creating a company jumps straight to the approval queue before the owner has finished setup.

**Goal:** Draft on create. The company owner requests approval during setup, which moves the company to Pending. A super admin approves only that pending request.

## Acceptance criteria

1. **Create** — `POST /company/register` stores `status = draft`. Existing pending, approved, and rejected rows stay as they are. No super-admin “pending review” notification and no `company_registered` email on create.
2. **Request approval** — The company owner (`company_admin`) can request approval while status is Draft, from My Companies and the company profile (web and mobile). Status becomes `pending`. Super admins are notified and the registration email sends at this step. The action is hidden for pending, approved, and rejected. A second request on a non-draft company returns 409.
3. **Approve** — Super admin **Approve** succeeds only when status is `pending` (or an already-rejected company, matching today’s menu). Approving a **draft** returns 409 and the Approve action is disabled. The pending dashboard list still shows only pending companies.
4. **Setup access** — A draft company remains selectable in Choose account and My Companies login, same as pending, so the owner can finish profile setup. Rejected stays blocked. Public catalog and member connect still require `approved`.
5. **Labels** — Status chips show **Draft** via the existing `StatusTag` (web kit and mobile kit). Help articles in English and Sinhala describe Draft, request approval, then Pending.

## Services affected

| Area | Change |
|------|--------|
| `webonone-v2/backend` | Enum migration, register as draft, owner request-approval route, approve guard, AI tool copy |
| `webonone-v2/frontend` | Draft chip, request action, approve disabled on draft, locale copy |
| `ui-kit` | `StatusTag` `draft` variant |
| `packages/mobile-ui` | `StatusTag` `draft` variant |
| `mobile` | Same owner request and admin approve rules |
| `support` | Company how-tos (`en` + `si`) |

## Out of scope

- Migrating existing pending companies back to draft
- A new super-admin status of Draft, or a wizard-step approval control
- Changing public catalog publish rules
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w support-root
```
