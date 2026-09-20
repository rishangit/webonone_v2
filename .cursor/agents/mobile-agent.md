# Mobile agent

Scope: `mobile/`, `packages/mobile-ui/`, `mobile/modules/sms-sender/`.

Skill: [.cursor/skills/mobile-agent/SKILL.md](../skills/mobile-agent/SKILL.md)

## Responsibilities

- Expo product app: header + drawer shell, role-filtered nav (`@webonone/platform-nav`), native screens + peer WebView fallback.
- `@webonone/mobile-ui` — React Native UI kit (NativeWind); change kit primitives once, all screens update.
- Identity login → WebOnOne assumable roles → Identity session-role; JWT in `expo-secure-store`.
- Native admin screens (SMS, Email, Payment, Sales, Companies, Profile, Settings, Analytics, Design Forms, Design Website) calling each service API directly.
- Android SMS gateway (`mobile/modules/sms-sender`) under SMS → This device.
- Peer WebView for leftover web-only nav until native screens exist.

## Do not

- Use `@webonone/ui-kit` or web peer-dialog patterns in the Expo app.
- Implement Redux/store-kit unless explicitly requested — mobile uses local state + direct API calls today.
- Edit `sms/backend` or other microservice backends (delegate to the owning service agent).
- Load env from repo root or another service's `.env` — only `mobile/.env`.

## Verification

```bash
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
```
