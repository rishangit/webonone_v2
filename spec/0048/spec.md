# Feedback 0048 — Keep only the pending company list card

| Field | Value |
|-------|-------|
| Ticket | `0048` |
| Feedback id | `xPV94dSFL17Atc1f80fPg` |
| Type | `bug` |
| Title | Keep only the pending company list card |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

After ticket 0047, the Super Admin Dashboard shows three company status cards (Pending, Approved, Rejected), a pending-company list, and an SMS Credits card. Super Admins need only the pending list so they can review new registrations. The list should show about three companies at a time and scroll inside the card when there are more. With fewer than three, the card should shrink to the list.

## Problem / goal

**Problem:** Extra cards crowd the Super Admin Dashboard. The pending list grows with every registration and has no inner scroll.

**Goal:** On the Super Admin Dashboard (web and mobile), show only the pending-company list card. Keep at most three rows in view, with a scrollbar inside the card when there are more. Let the card height follow the list when there are fewer than three. Other roles keep today’s events, upcoming events, and (company owners) SMS Credits.

## Acceptance criteria

1. **Super Admin (web)** — Dashboard shows only the pending-company list card (name, status, created date, newest first). Status count cards and the SMS Credits card are not on this page. An empty list still says there are no pending companies. Opening a row still goes to `/companies/:companyId`.
2. **List height (web)** — At most three companies are visible. A fourth or later company is reached by scrolling inside the card (`scrollbar-themed`). One or two companies make the card shorter. Zero companies keep the empty state without a tall empty scroll area.
3. **Other roles (web)** — Company owners, staff, and members still see today’s and upcoming events. Company owners still see SMS Credits when Text.lk is set up. Super Admins still see SMS Credits on **SMS → Dashboard**.
4. **Mobile** — Super Admin Dashboard matches the web layout: pending list only, three rows visible, inner scroll when there are more, shorter card when there are fewer. A row still opens the company detail screen.
5. **Help** — English and Sinhala Dashboard articles describe only the pending list for Super Admins (about three visible, scroll for more) and say SMS Credits on the home Dashboard is for company owners. SMS overview no longer says Super Admins see that card on the home Dashboard.

## Services affected

| Area | Change |
|------|--------|
| `webonone-v2/frontend` | Super Admin home layout and pending-list scroll |
| `mobile/` | Same Super Admin dashboard layout |
| `support/` | Dashboard and SMS overview how-tos (`en` + `si`) |
| `spec/0048/` | This package |

## Out of scope

- Removing SMS Credits from **SMS → Dashboard**
- Approve or reject actions on the Dashboard
- Company owner, staff, or member event dashboards
- Backend or API changes
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w support-root
```
