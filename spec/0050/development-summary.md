# Development summary — 0050

| Field | Value |
|-------|-------|
| Ticket | `0050` |
| Feedback id | `qijF17qkpFEtbpkMNuB-R` |
| Title | Company status needs improvement |
| Type | `feature` |
| Completed | 2026-10-21 |

## What was delivered

A new company is stored as **Draft** instead of going straight into the approval queue. The owner can finish setup and choose **Request approval** on My Companies or the company profile (web and mobile). That moves the company to **Pending**, emails the registration notice, and alerts super admins. **Approve** stays available for a pending request (and for a rejected company, as before). Approving a draft company is rejected by the API and the Approve action is disabled.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging web | https://app.webonone.com/ — **Companies → My Companies** (owner) and **Companies → All Companies** (Super Admin) |
| Local web | `npm run dev:webonone` — `/settings/companies` and `/companies` |
| Mobile | `npm run mobile` — My Companies and company detail |
| Support | `/docs/companies/register-company`, `/docs/companies/pending-approval`, `/docs/companies/approve-companies` (`en` and `si`) |

## Feature details

- Existing pending, approved, and rejected companies are unchanged. Only new rows default to draft.
- Draft and pending companies still appear in **Choose account**. Rejected companies still cannot be opened. Public catalog and connecting as a member still require **Approved**.
- **Request approval** is shown only to the company owner while status is Draft. A second request returns 409.
- The super-admin home pending list still lists only pending companies, so drafts stay off that card until the owner requests approval.
- Super admin **Set pending** and **Reject** stay on the admin menu. Approve is disabled for Draft and Approved.

## UI reuse

- Screen: company status chip, owner row menu, company profile header action, super-admin row menu.
- Similar UI: `StatusTag` on `CompaniesList`, `MyCompaniesList`, `CompanyProfileCard`; admin Approve / Set pending / Reject menu; `FeaturePage` actions (`WebononeCopyToAiButton`).
- Kit export: `StatusTag` (`draft` variant on `@webonone/ui-kit` and `@webonone/mobile-ui`), `DropdownMenuItem` / `ItemListMenuItem`, `Button`, `useToast`.
- Action: reuse in place. No new status-menu component. Request approval is a header button beside Copy to AI and a row-menu item, not a wizard step.

## Code and docs touched

| Area | Paths |
|------|--------|
| WebOnOne backend | `webonone-v2/backend/migrations/20261021193000_company_draft_status.ts`, `company.service.ts`, `company.routes.ts`, `company.controller.ts`, `capabilities.ts` |
| WebOnOne frontend | `CompaniesList.tsx`, `MyCompaniesList.tsx`, `CompanyProfilePage.tsx`, `AllCompaniesPage.tsx`, `companiesStore.ts`, locales `en`/`si` |
| UI kit | `ui-kit/package/src/components/StatusTag.tsx`, showcase `TagsPage.tsx` |
| Mobile | `packages/mobile-ui` `StatusTag`, `MyCompaniesList`, `CompanyDetailScreen`, `AdminCompaniesList` |
| Support | `support/frontend/src/content/{en,si}/companies/` plus dashboard, switch-account, and glossary notes |
| Spec | `spec/0050/` |

## Verification run

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

`@webonone/mobile` has no `lint` script. WebOnOne frontend lint reported existing `react-hooks/exhaustive-deps` warnings and 0 errors. Signed-in browser clicks were not run in this session.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0050: company status draft then pending approval` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | identity, webonone, media, email, data, sms, payment, website, design, ai, support |
| **Why** | `ui-kit` `StatusTag` fans out to every IIS consumer. `mobile-ui` has no IIS consumers. `webonone` and `support` also change directly. `mobile/` and `spec/` are ignored for IIS. |
| Detect command | `npm run deploy:detect -- --files <working-tree list> --print` (HEAD vs `origin/deploy_staging` was empty before the commit) |

## Support status

`developed` until the push to `deploy_staging` succeeds, then `staging`. `closed` stays with a super admin.
