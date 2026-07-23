# WebOnOne Platform — Specification (1.13.4)

Extends [1.13.2](../1.13.2/README.md) by adding **tabs** on the **Company profile** page: **Profile** (existing three-card view unchanged) and **Gallery** (company logo upload + multi-image gallery). Company media is stored under Media service paths scoped per company.

**Spec No:** 1.13.4

Implementation branch: **`spec/1.13.4`**

## What changed from 1.13.2

| Area | Before | 1.13.4 |
|------|--------|--------|
| Company profile layout | Single page: three cards stacked | **Tabs:** Profile \| Gallery |
| Profile content | Company profile / Contact / Location cards | **Unchanged** — same three cards on Profile tab |
| Logo management | Optional / incomplete on profile card | **Gallery tab** — Logo card (show + upload via Media) |
| Company gallery | None | **Gallery tab** — Gallery card (add multiple images via Media) |
| Media folder paths | Pending/legacy `/logo` helpers | **`/companies/{companyId}/profile`** and **`/companies/{companyId}/gallery`** |

## Projects affected

| Project | Role in 1.13.4 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/`) | Company profile tabs; Gallery tab UI; Media dialog + path helpers; persist logo + gallery refs |
| **WebOnOne backend** | Optional gallery refs on company detail/PATCH (logo already supported) |
| **Media** | Reuse existing picker/upload/crop embeds — no Media schema change required |
| **UI Kit** | Reuse `FeaturePage`, `Card`, Radix tabs pattern — no new primitive required |
| **Identity** | No change |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-company-profile-tabs.md](./02-company-profile-tabs.md) | FeaturePage + Profile / Gallery tabs shell |
| [03-profile-tab.md](./03-profile-tab.md) | Keep current three-card Profile view |
| [04-gallery-tab.md](./04-gallery-tab.md) | Logo card + Gallery card |
| [05-media-paths-and-integration.md](./05-media-paths-and-integration.md) | Scope, folder paths, Media dialog contract |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.13.4 Company profile Profile/Gallery tabs | TBD | All docs |
| Subtask: Company profile tabs shell | TBD | [02](./02-company-profile-tabs.md) |
| Subtask: Profile tab preserves current cards | TBD | [03](./03-profile-tab.md) |
| Subtask: Gallery tab logo + multi-image cards | TBD | [04](./04-gallery-tab.md) |
| Subtask: Media paths companies/{id}/profile \| gallery | TBD | [05](./05-media-paths-and-integration.md) |

## Revision history

- **2026-07-23** — Initial spec: Company profile Profile / Gallery tabs; Media paths for logo and gallery images.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.13.2/02-company-profile-page.md](../1.13.2/02-company-profile-page.md) | Three-card profile (Profile tab content) |
| [../1.13.2/04-company-detail-api.md](../1.13.2/04-company-detail-api.md) | Company GET/PATCH including `logoUrl` |
| [../1.13.3/03-basic-settings-page.md](../1.13.3/03-basic-settings-page.md) | Tabs pattern reference (Basic Settings) |
| [../1.5.0/02-identity-profile-page.md](../1.5.0/02-identity-profile-page.md) | Media selector + crop for profile image |
| [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md) | JWT init, postMessage, scope / folderPath |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Feature page | `.cursor/rules/feature-page-layout.mdc` |
| Details / cards | `.cursor/skills/details-page-cards/SKILL.md` |
| Media dialogs (core host) | `.cursor/rules/platform-shell-navigation.mdc` · `PlatformMediaDialogHost` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| WebOnOne scope | `.cursor/rules/webonone-v2-project.mdc` |
| Microservice media | `.cursor/rules/microservice-architecture.mdc` |

## Local dev

```bash
npm run dev:webonone   # Company profile UI + API
npm run dev:media      # Picker / upload / crop embeds
npm run dev:identity   # JWT for Media init
```

Manual test: Open company profile → Profile tab shows three cards → Gallery tab → upload logo into `companies/{id}/profile` → add multiple gallery images into `companies/{id}/gallery` → refresh shows both.
