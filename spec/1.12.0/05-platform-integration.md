# 05 — Platform integration and release (1.12.0)

Identity phone-OTP integration, WebOnOne nav, security rules, and the end-to-end release checklist. Implements ClickUp subtask **TBD**.

## Integration overview

```text
Identity BE ──HTTP internal──► SMS BE ──queue──► Gateway device ──SIM──► Customer
WebOnOne BE ──HTTP internal──► SMS BE (optional company SMS)

Mobile app ──login──► Identity BE
Mobile app ──device key──► SMS BE (register / poll / status)

SMS admin FE ──► SMS BE only (JWT)
WebOnOne FE ──redirect──► SMS admin FE (optional menu entry)
```

## Identity integration (phone OTP — optional but recommended)

Enable SMS-based OTP (e.g. phone verification / 2FA) by having Identity call the SMS internal API, mirroring the existing `emailClient.service.ts`.

1. Add `identity/backend/src/services/smsClient.service.ts`:

```typescript
POST {SMS_API_BASE_URL}/api/v1/internal/otp/send
X-Sms-Service-Key: {SMS_SERVICE_API_KEY}
{
  toNumber: user.phoneNumber,
  purpose: 'phone_verification',
  requestedByService: 'identity'
}
```

2. Verify via `POST /api/v1/internal/otp/verify` with `{ toNumber, purpose, code }`.
3. SMS service owns the code (generation, hashing, expiry, attempts). Identity only triggers send + checks verify result.

### Identity env additions

`identity/backend/.env.example`:

```env
SMS_API_BASE_URL=http://localhost:4016
SMS_SERVICE_API_KEY=dev-sms-service-key
```

## WebOnOne integration (optional)

- Company-triggered SMS (e.g. notifications) via `POST /api/v1/internal/send` with the company's `companyId` — routed to that company's devices.
- Optional core-nav **SMS** entry (redirect handoff), per [02-sms-service-scaffold.md](./02-sms-service-scaffold.md).

`webonone-v2/backend/.env.example`:

```env
SMS_API_BASE_URL=http://localhost:4016
SMS_SERVICE_API_KEY=dev-sms-service-key
```

`webonone-v2/frontend/.env.example`:

```env
VITE_SMS_ORIGIN=http://localhost:3016
```

## Security

| Rule | Detail |
|------|--------|
| Internal API key | Required on all `/api/v1/internal/*`; rotate via env |
| Device key | Per-device secret; stored hashed; sent as `X-Sms-Device-Key`; revocable |
| Device scope | Derived from registrant JWT role — never client-supplied |
| JWT on public API | Verify signature, `iss` (`webonone-identity`), `aud` (`webonone-api`), `exp` locally |
| OTP | Hash codes at rest; enforce expiry + max attempts; never return the code |
| No secrets in FE | Mobile stores only JWT + device key (SecureStore); no service key on device |
| Company isolation | Company admins see/route only their `company_id`; platform devices never see company rows |
| Audit | Log device approve/revoke, template edits, manual sends |

## Release checklist

1. [ ] SMS standalone: `dev:sms` → login → dashboard; `/health` ok
2. [ ] Super admin registers a **platform** device; approves it; sends system test SMS → received
3. [ ] Company admin registers a **company** device; approves it; sends company test SMS → received
4. [ ] Platform message not delivered to a company device and vice versa (scope isolation)
5. [ ] OTP send + verify works (hashed, expiring, attempt-limited)
6. [ ] Identity phone OTP (if enabled) triggers SMS via internal API
7. [ ] Mobile: login → register → approve → foreground service delivers queued SMS; heartbeat updates status
8. [ ] iOS build logs in and shows Android-only gateway state
9. [ ] `npm run type-check -w sms-root` and `mobile` type-check pass; migrations apply
10. [ ] Root `npm run dev` includes SMS service; `mobile` runs via its own scripts

## Acceptance (subtask 4)

- [ ] Identity phone OTP path uses SMS internal API (if enabled)
- [ ] WebOnOne optional SMS nav / company send wired
- [ ] Security rules applied (device key, scope, OTP, isolation)
- [ ] Full end-to-end flow ready for release
