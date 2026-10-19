# Feedback 0047 — Super admin dashboard shows pending companies

| Field | Value |
|-------|-------|
| Ticket | `0047` |
| Feedback id | `Yb-uqqHM70zZRWnzbmOwZ` |
| Type | `feature` |
| Title | The super admin login dashboard must display pending companies. |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

After a Super Admin signs in, **Dashboard** (the home page) is empty of company registrations. New companies stay **pending** until a Super Admin reviews them under **Companies → All Companies**. The Dashboard should show company status counts and the pending registrations so a Super Admin can see new companies immediately after login.

## Problem / goal

**Problem:** The Super Admin Dashboard does not list pending companies or show how many companies are pending, approved, or rejected.

**Goal:** On the Super Admin Dashboard, show three company status cards (Pending, Approved, Rejected) and a list of pending companies. Opening a row goes to that company’s profile. Other roles keep the existing event dashboard.

## Acceptance criteria

1. **Super Admin (web)** — Dashboard shows status cards for Pending, Approved, and Rejected with counts of all companies. Cards sit above a pending-company list (name and created date, newest first). An empty list says there are no pending companies.
2. **Open a pending company (web)** — Choosing a pending row opens `/companies/:companyId` (the existing Super Admin company profile).
3. **Other roles (web)** — Company owners, staff, and members still see today’s and upcoming events. Company owners and Super Admins still see **SMS Credits** when Text.lk is set up.
4. **Mobile** — Super Admin Dashboard shows the same status cards and pending list. A row opens the company detail screen. Other roles stay on the event dashboard.
5. **Help** — English and Sinhala Dashboard articles say Super Admins see company status cards and the pending list, and that review still happens on All Companies.

## Services affected

| Area | Change |
|------|--------|
| `webonone-v2/frontend` | Super Admin Dashboard status cards and pending list |
| `webonone-v2/backend` | None — reuse `GET /api/v1/company/admin/companies` |
| `mobile/` | Same Super Admin Dashboard content |
| `support/` | Dashboard how-to (`en` + `si`) |
| `spec/0047/` | This package |

## Out of scope

- Approve or reject actions on the Dashboard (profile and All Companies already do that)
- Analytics charts
- Company owner or member dashboards
- A new company-status API
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w support-root
```
