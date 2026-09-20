---
name: mobile-agent
description: >-
  Mobile app agent for webonone-platform. Handles mobile/ Expo app,
  packages/mobile-ui, and mobile/modules/sms-sender — native screens, peer
  WebView, Android SMS gateway, session auth. Use when tasks touch mobile/,
  @webonone/mobile-ui, Expo Router, or the mobile product shell.
---

# Mobile agent skill

**Subagent:** [.cursor/agents/mobile-agent.md](../../agents/mobile-agent.md)

## Scope

**Allowed paths:**

- `mobile/` — Expo app (Expo Router, feature screens, peer WebView)
- `packages/mobile-ui/` — React Native UI kit (NativeWind)
- `mobile/modules/sms-sender/` — Android native SMS module

**Do not edit:** microservice backends (`sms/backend`, `identity/backend`, etc.) — delegate to the owning service agent. SMS admin **API** changes stay with sms-agent; mobile gateway UI and native screens stay here.

## Rules

- [mobile-project.mdc](../../rules/mobile-project.mdc) — stack, env, auth, WebView policy
- [mobile-ui-consumption.mdc](../../rules/mobile-ui-consumption.mdc) — mandatory `@webonone/mobile-ui`
- [mobile-structure.mdc](../../rules/mobile-structure.mdc) — feature folders, `@/` imports
- [mobile-dialogs.mdc](../../rules/mobile-dialogs.mdc) — RN `CustomDialog` (no peer-dialog)
- [mobile-list-pagination.mdc](../../rules/mobile-list-pagination.mdc) — on-scroll `ListPageFooter` + shared hooks
- [mobile-ui-project.mdc](../../rules/mobile-ui-project.mdc) — kit package conventions
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports, dead code cleanup
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc) — JWT verify locally; no shared DB

## Cross-cutting skills (mobile sections)

| Skill | Mobile use |
|-------|------------|
| [form-creation](../form-creation/SKILL.md) | Same Zod + BE validation; `FormField` / `TextField` from mobile-ui |
| [item-list](../item-list/SKILL.md) | `ItemList*` primitives from mobile-ui |
| [toast-notifications](../toast-notifications/SKILL.md) | `useToast` from mobile-ui |
| [date-display](../date-display/SKILL.md) | Same `DISPLAY_DATE_OPTIONS` shape |

**Web-only (do not apply):** core-hosted-peer-dialog, feature-store, redux-store-and-epics, platform-shell-navigation, ui-kit-consumption.

## Languages

Native uses the same `en`/`si` JSON packs as web (`@webonone/i18n` + Metro `@locales/<service>` aliases). Do not duplicate locale files in `mobile/`. Wire screens with `useTranslation('<ns>')`. Colliding SMS/Email namespaces are prefixed (`smsTemplates`, `emailShell`, …). Persist locale in SessionContext (secure storage + Identity `PATCH /auth/me`). Kit stays locale-agnostic — pass `headerLabels` / `ListPageFooter` `summary`.

## Auth and session

1. Identity `POST /auth/login` → JWT stored in `expo-secure-store` ([SessionContext.tsx](../../../mobile/src/features/auth/SessionContext.tsx)).
2. WebOnOne `GET /company/me/assumable-roles` → role picker when needed.
3. Identity `POST /auth/session-role` → reissued JWT with selected role.
4. Profile via Identity `GET /auth/me` on native Profile screen (not WebView).

## Routing

- `mobile/app/**` — thin Expo Router files only; delegate to `src/features/**/screens/**`.
- `AuthGate` in `app/_layout.tsx` redirects unauthenticated users to `/login`.
- Authenticated shell: `app/(app)/_layout.tsx` → `AppShellLayout` (drawer + header).
- Catch-all `app/(app)/[...path].tsx` → peer WebView or browser fallback.

## Native vs WebView

| Area | Strategy |
|------|----------|
| Profile, SMS, Email, Payment, Sales, Companies, Settings, **Data**, **Identity/Users**, **Staff**, **Calendar**, **Analytics**, **Design Forms**, **Design Website** | Native screens + direct API |
| Other web-only nav | Browser fallback (`Linking.openURL`) |

WebView injects JWT into peer `localStorage` + `postMessage` `webonone:platform:init` — see [PeerWebViewScreen.tsx](../../../mobile/src/features/peer/PeerWebViewScreen.tsx).

## List pagination

Native collection screens use **on-scroll append** only — no pager UI.

1. `FeatureScreen` → `onScroll={useListPageScroll(hook)}`
2. `ListPageBody` → list component + `ListPageFooter` (`mt-auto` pins summary to bottom when the list is short)
3. `ListPageFooter` → `loadedCount`, `totalCount`, `hasMore`, `loadingMore`
4. Server API → `useServerPaginatedList`; in-memory filter → `useClientInfiniteList`

Rule: [mobile-list-pagination.mdc](../../rules/mobile-list-pagination.mdc). After create/update/delete, call `list.reload()`.

## Env

Config lives in `mobile/.env` only (see `mobile/.env.example`). Loaded via `app.config.ts` → `extra` → [env.ts](../../../mobile/src/shared/config/env.ts). For physical devices, use LAN IP (not `localhost`).

## Reference implementations

| Pattern | File |
|---------|------|
| Server list + on-scroll | `mobile/src/features/sales/screens/SalesHistoryScreen.tsx` |
| Client slice + on-scroll | `mobile/src/features/companies/AllCompaniesScreen.tsx` |
| Dialog form | `mobile/src/features/email/components/TemplateFormDialog.tsx` |
| App shell + drawer | `mobile/src/features/shell/AppShellLayout.tsx` |
| Profile edit dialog | `mobile/src/features/profile/ProfileEditDialog.tsx` |
| UI kit gallery | `mobile/src/features/kit/pages/DialogsShowcase.tsx` |
| Kit barrel | `packages/mobile-ui/src/index.ts` |

## iOS / Android notes

- SMS gateway (This device) is **Android-only**; iOS shows an Android-only state.
- Google Sign-In is Android-only; requires dev/prebuild build (not Expo Go).
- Text.lk gateway mode does not require the mobile app.

## Verification

```bash
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
```

**Manual:** `npm run mobile` from repo root; sign in, confirm drawer nav, open a native screen (Analytics or Design → Forms) and a WebView peer (Design → Website).
