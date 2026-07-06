# WebOnOne Platform — Specification (1.11.3)

Fix **mouse wheel scrolling** on the Identity **Profile** page when opened from WebOnOne core via the platform iframe embed (`/profile`).

**Spec No:** 1.11.3

Implementation branch: **`spec/1.11.3`**

## What changed from 1.11.2

| Area | 1.11.2 | 1.11.3 |
|------|--------|--------|
| Core → Profile embed | Profile loads in iframe; scrollbar visible but wheel inert | Wheel scrolls `.platform-embed-shell-main` inside embed |
| Platform embed shell | Native overflow only | Explicit wheel handler in embed iframe (cross-origin safe) |

## Projects affected

| Project | Role in 1.11.3 |
|---------|----------------|
| **packages/platform-embed** | `useEmbedMainWheelScroll` + `PlatformEmbedShell` ref |
| **Identity** (`identity/frontend/`) | Profile consumed via embed — no page-level change expected |
| **WebOnOne v2** (`webonone-v2/frontend/`) | Hosts `PlatformPeerFrame` for `/profile/*` — verify only |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, success criteria |
| [02-profile-embed-scroll-fix.md](./02-profile-embed-scroll-fix.md) | Root cause, fix, acceptance |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.11.3 Profile scroll wheel | 86ey61krq | All docs |

## Revision history

- **2026-07-06** — Initial spec from ClickUp parent description (profile iframe wheel scroll).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.11.2/02-cross-service-nav-fix.md](../1.11.2/02-cross-service-nav-fix.md) | Platform peer iframe pattern |
| [platform-shell-navigation.mdc](../../.cursor/rules/platform-shell-navigation.mdc) | Profile three-layer handoff |
| [loading-empty-states.mdc](../../.cursor/rules/loading-empty-states.mdc) | Embed loading overlay |

## Rules reference

| Topic | Rule |
|-------|------|
| Platform embed | `platform-shell-navigation.mdc` |
| Service boundaries | `microservice-architecture.mdc` |
| Identity scope | `.cursor/skills/identity-agent/SKILL.md` |

## Local dev

```bash
npm run dev:webonone   # Core host (port 3000)
npm run dev:identity   # Profile embed target (port 3001)
```

Manual test: WebOnOne → Profile nav → scroll profile form with mouse wheel (not only scrollbar drag).
