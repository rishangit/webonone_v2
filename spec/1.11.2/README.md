# WebOnOne Platform — Specification (1.11.2)

Fix cross-service **platform shell navigation** when moving between **Data** and **Email** satellite admin apps. Today, clicking a peer service item in the left nav (e.g. Email → Templates while on Data → Tags) sends the user to the **core home page** instead of the intended satellite route.

**Spec No:** 1.11.2

Implementation branch: **`spec/1.11.2`**

## What changed from 1.11.1

| Area | 1.11.1 | 1.11.2 |
|------|--------|--------|
| Data → Email nav | Core nav links resolve Email items to core origin + sentinel path (404 → home) | Auth-code redirect to Email with correct sub-path |
| Email → Data nav | Same broken fallback to core home | Auth-code redirect to Data with correct sub-path |
| Satellite AppLayouts | Only local + core links wired; no peer outbound handlers | Mirror WebOnOne `withExternalNavActions` pattern for cross-satellite hops |

## Projects affected

| Project | Role in 1.11.2 |
|---------|----------------|
| **Data** (`data/frontend/`) | Add `redirectToEmail.ts`, peer config, external nav click handlers in `AppLayout` |
| **Email** (`email/frontend/`) | Add `redirectToData.ts`, peer config, external nav click handlers in `AppLayout` |
| **packages/platform-nav** | Optional: export shared `withExternalNavActions` helper to avoid duplication |
| **Root** | No workspace changes |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, success criteria |
| [02-cross-service-nav-fix.md](./02-cross-service-nav-fix.md) | Root cause, required handlers, acceptance |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan (implementation) |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.11.2 Bug fixing | 86ey5wdua | All docs |
| Subtask: [Bug] issue in navigation with service | 86ey5we2u | [02-cross-service-nav-fix.md](./02-cross-service-nav-fix.md); Phase 1 |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.11.0/06-platform-integration.md](../1.11.0/06-platform-integration.md) | Data platform shell + auth-code handoff |
| [../1.9.0/05-platform-integration.md](../1.9.0/05-platform-integration.md) | Email platform shell |
| [platform-shell-navigation.mdc](../../.cursor/rules/platform-shell-navigation.mdc) | Canonical three-layer handoff pattern |

## Rules reference

| Topic | Rule |
|-------|------|
| Platform nav | `platform-shell-navigation.mdc` |
| Service boundaries | `microservice-architecture.mdc` |
| Data scope | `.cursor/skills/data-agent/SKILL.md` |
| Email scope | `.cursor/rules/email-project.mdc` |

## Local dev

```bash
npm run dev:webonone   # Core return_url origin
npm run dev:data       # Data FE + BE
npm run dev:email      # Email FE + BE
npm run dev:identity   # Auth-code issuer
```

Manual test: open Data via WebOnOne nav → Tags → click Email → Templates; must land on Email `/templates`, not core `/`.
