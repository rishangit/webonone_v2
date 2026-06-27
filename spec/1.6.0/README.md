# WebOnOne Platform — Specification (1.6.0)



Extends [1.5.0](../1.5.0/README.md) with **company registration**, admin approval workflow, and **platform user roles** scoped to companies — all implemented as a **WebOnOne v2 feature** (not a separate microservice). WebOnOne v2 gains a **Basic Settings** page where logged-in users register a company via a **3-step wizard**, see pending/approved status, and view company details after approval. A **super admin** (seeded credentials in `webonone_v2`) approves pending registrations.



Implementation branch: **`spec/1.6.0`**



**Spec No:** 1.6.0



## Revision history



- **Architecture:** Company is a **WebOnOne v2 core feature** — backend logic, API, and UI live under `webonone-v2/`; the standalone `company/` microservice was removed.

- **Schema naming:** Corrected `webonon_v2` → **`webonone_v2`** to match [1.2.0](../1.2.0/README.md).

- **Database:** Company tables in **WebOnOne core DB** (`webonone_v2`); migrations under `webonone-v2/backend/migrations/`.

- **Registration UX polish (subtask 86ey2punp):** Remove logo from registration wizard; fix Select z-index inside dialogs; Previous/Next footer buttons with icon + text labels; `CountrySelect` and `PhoneInput` from UI Kit; make state/region and postal code optional.

- **Super admin UX (revision):** Login via default `/login`; role-aware nav (Home, Companies, Settings); all companies list with approve / reject / pending actions.



## What changed from 1.5.0



| Area | 1.5.0 | 1.6.0 |

|------|-------|-------|

| Company domain | None | **WebOnOne v2 feature** — companies, memberships, roles, super-admin auth, approval API |

| WebOnOne settings | System Theme only | **Basic Settings** — company registration prompt, **3-step register wizard**, company section |

| User roles (platform) | None in WebOnOne | `member` (default), `company_admin` (after approval), `super_admin` (seeded) |

| Company logo | N/A | `logo_url` column; display if set; **upload deferred** (post-approval edit — future spec) |

| Super admin | N/A | Email allowlist in `webonone_v2`; login at `/login`; **Companies** nav with status management |



## Projects affected



| Project | Role in 1.6.0 |

|---------|----------------|

| **WebOnOne v2** (`webonone-v2/`) | Company backend, Basic Settings, register wizard, super-admin **Companies** page |

| **UI Kit** (`ui-kit/`) | `CountrySelect`, `PhoneInput`, dialog-safe `Select`/`Popover` z-index |



## Documents



| Doc | Topic |

|-----|-------|

| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |

| [02-company-service.md](./02-company-service.md) | Company backend — schema, roles, API, super-admin seed |

| [03-webonone-company-ui.md](./03-webonone-company-ui.md) | Basic Settings, register wizard, company section |

| [04-super-admin-approval.md](./04-super-admin-approval.md) | Super-admin login, pending list, approve → role update |

| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |

| [plan.mdc](./plan.mdc) | Agent implementation plan |



## ClickUp traceability



| Subtask | ID | Spec doc / phase |

|---------|-----|------------------|

| [User Story] Spec No 1.6.0 Register my company | 86ey2nrgd | All docs |

| Core project need to have the user roles | 86ey2p61f | [02](./02-company-service.md), [03](./03-webonone-company-ui.md), [04](./04-super-admin-approval.md); Phases 1–5 |

| comapny registration need to improve | 86ey2pmp2 | [03](./03-webonone-company-ui.md) — wizard; [02](./02-company-service.md) — extended fields; Phase 6 |

| comapny regitration improvements | 86ey2punp | [03](./03-webonone-company-ui.md) — registration UX polish; [ui-kit](../../ui-kit/package/) — overlay z-index; Phase 7 |



## Inherited from earlier specs



| Doc | Topic |

|-----|-------|

| [../1.5.0/02-identity-profile-page.md](../1.5.0/02-identity-profile-page.md) | Media consumer patterns in platform apps |

| [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md) | JWT init, postMessage, scope/folderPath |

| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | JWT verification on consumer backends |

| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Standalone microservice layout |



## Rules reference



| Topic | Rule |

|-------|------|

| Service boundaries | Company is part of WebOnOne v2 — same `webonone_v2` schema, native API routes |

| Cross-service auth | JWT verified locally; `user_id` CHAR(21) foreign copy only |

| Env | Per-layer `frontend/.env` and `backend/.env`; frontend calls own API (`VITE_API_BASE_URL`) |



## Local dev



```bash

npm run dev:webonone   # WebOnOne FE + BE (includes company feature)

```

