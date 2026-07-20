# 03 — Gateway and sending engine (1.12.0)

Database schema, OTP, queue, device polling API, scope routing, reaper worker, and internal API. Implements ClickUp subtask **TBD**.

## Principles

- **The phone SIM is the transport** — the backend never sends SMS itself; it queues messages and devices pull + send them.
- **Queue-first** — every send (internal, UI, or OTP) enqueues a row, then a device claims and delivers it.
- **Device pulls, server routes** — devices poll; the server hands each device only messages matching its scope.
- **Secrets protected** — device keys stored hashed; OTP codes stored hashed; service key only in backend env.

## Database schema (sms tables)

| Table | Purpose |
|-------|---------|
| `sms_devices` | `id`, `name`, `owner_user_id`, `scope` (`platform`\|`company`), `company_id` nullable, `device_key_hash(64)`, `status` (`pending`\|`approved`\|`revoked`), `sim_slots` JSON, `app_version`, `last_seen_at`, timestamps |
| `sms_templates` | `id`, `slug`, `name`, `body`, `scope` (`platform`\|`company`), `company_id` nullable, `is_active`, `required_keys` JSON, timestamps |
| `sms_template_versions` | Version history for restore |
| `sms_queue` | `id`, `template_slug` nullable, `to_number`, `body`, `payload_json`, `company_id` nullable, `scope`, `status`, `assigned_device_id` nullable, `sim_slot` nullable, `retry_count`, `max_retries`, `priority`, `scheduled_at`, `dispatched_at`, `processed_at`, `last_error` |
| `sms_history` | Immutable record: `queue_id`, `to_number`, `status` (`sent`\|`failed`), `device_id`, `sim_slot`, `provider_message_ref` nullable, `error_message`, `created_at` |
| `sms_otps` | `id`, `phone_number`, `otp_hash(64)`, `purpose`, `company_id` nullable, `expires_at`, `used_at`, `attempt_count`, `created_at` |
| `sms_audit_log` | Admin actions: who, action, entity, metadata |

IDs are 21-char (nanoid). Timestamps `datetime(3)` default `now(3)`. Index `sms_queue (status, scheduled_at)` and `(scope, company_id, status)` for scoped claims.

## OTP

- **Generate:** 6-digit code (`crypto.randomInt(100000, 1000000)`), hashed SHA-256 before storage, `expires_at = now + OTP_TTL_SECONDS`, `attempt_count = 0`.
- **Send:** enqueue an `sms_queue` row using the `otp` template with `payload.code`; return only `{ otpId, status: 'queued' }` — never the code.
- **Verify:** look up latest active OTP for `phone_number` + `purpose`; reject if expired, used, or `attempt_count >= max`; on mismatch increment `attempt_count`; on match set `used_at`.
- Mirrors the Identity OTP pattern ([../1.9.1/02-identity-otp-reset.md](../1.9.1/02-identity-otp-reset.md)).

## Templates

Full template ownership, scope/override rules, seeds, SMS length rules, and management API/UI are in [06-sms-templates.md](./06-sms-templates.md). Summary:

- Two scopes: **platform** (system, super admin) and **company** (company owner). Resolution: company override → platform default → reject if none.
- `{{key}}` placeholder replacement; `required_keys` validated before enqueue.
- Seeded platform slugs: `otp`, `phone_verification`, `password_reset`, `generic`. Company templates are authored per company (not seeded).

## Queue and scope routing

### Enqueue

`SmsQueueService.enqueue({ templateSlug?, body?, toNumber, payload?, companyId?, priority? })`:

1. Resolve template (company override → platform) or use raw `body`.
2. Render placeholders; validate required keys.
3. Insert `sms_queue` status `pending`, `scope = companyId ? 'company' : 'platform'`, `scheduled_at = now`.

### Scope routing (who delivers what)

| Message | Delivered by |
|---------|--------------|
| `company_id = null` (`scope=platform`) | Any approved **platform** device |
| `company_id = X` (`scope=company`) | Approved **company** device with `company_id = X` |

## Device API (device key auth)

Auth: header `X-Sms-Device-Key: {rawDeviceKey}` → `deviceAuth.ts` hashes and matches `sms_devices.device_key_hash`; rejects unknown/`revoked`. All device routes require `status = approved` except register.

| Route | Purpose |
|-------|---------|
| `POST /api/v1/device/register` | Create `sms_devices` row (`status=pending`), scope from the caller's **user JWT** (super_admin→platform, company_admin→company). Returns a one-time raw `deviceKey` (store hash only). |
| `POST /api/v1/device/heartbeat` | Update `last_seen_at`, `app_version`, `sim_slots`; returns approval status. |
| `GET /api/v1/device/messages?max=N` | Atomically claim up to N due `pending` rows matching the device scope with `FOR UPDATE SKIP LOCKED`; set `processing`, `assigned_device_id`, `dispatched_at`; return `[{ id, toNumber, body, simSlot? }]`. |
| `POST /api/v1/device/messages/:id/status` | Body `{ status: 'sent' \| 'failed', simSlot?, providerMessageRef?, error? }`. On `sent`: mark `sent` + insert `sms_history`. On `failed`: retry/backoff or final `failed` + history. |

> `register` uses the **user JWT** (an authenticated operator claims the phone); subsequent calls use the returned **device key**. This keeps device scope server-derived.

## Reaper worker

`workers/reaper.ts` — `setInterval(QUEUE_WORKER_INTERVAL_MS)`; single-flight guard:

1. Revert `processing` rows older than `PROCESSING_TIMEOUT_MS` back to `pending` (device went offline mid-send).
2. Reschedule retryable `failed` rows (`retry_count < max_retries`) with backoff `[60s, 300s, 900s]`.
3. Mark devices offline when `last_seen_at` older than `DEVICE_STALE_MS`.
4. Expire OTPs past `expires_at` (cleanup).

The worker does **not** send — delivery is entirely device-driven.

## Internal API (service key)

Auth: header `X-Sms-Service-Key: {SMS_SERVICE_API_KEY}` → `internalAuth.ts`.

| Route | Body (Zod) | Response |
|-------|-----------|----------|
| `POST /api/v1/internal/send` | `{ toNumber, body?, templateSlug?, payload?, companyId?, requestedByService }` | `{ queueId, status: 'queued' }` |
| `POST /api/v1/internal/otp/send` | `{ toNumber, purpose, companyId?, requestedByService }` | `{ otpId, status: 'queued' }` |
| `POST /api/v1/internal/otp/verify` | `{ toNumber, purpose, code, companyId? }` | `{ valid: boolean }` |

Consumers store `SMS_API_BASE_URL` + `SMS_SERVICE_API_KEY` in their `backend/.env.example`.

## Public API (UI, JWT + role)

- `POST /api/v1/send`, `POST /api/v1/send/test` — manual/test send (company-scoped for company_admin).
- `POST /api/v1/otp/send`, `POST /api/v1/otp/verify` — OTP send/verify.
- `GET /api/v1/devices`, `POST /api/v1/devices/:id/approve`, `POST /api/v1/devices/:id/revoke` — device admin (company-scoped for company_admin).
- `GET /api/v1/queue`, `POST /api/v1/queue/:id/retry` (super_admin), `GET /api/v1/history`, templates CRUD, `GET /api/v1/dashboard/stats`.

## Acceptance (subtask 2)

- [ ] Tables created; scope index present
- [ ] Enqueue renders templates + validates required keys
- [ ] Scope routing: platform vs company messages reach only matching devices
- [ ] Device claim uses `FOR UPDATE SKIP LOCKED`; status callback writes history
- [ ] OTP generate/verify: hashed at rest, expiry + max attempts enforced
- [ ] Reaper: un-sticks processing, retries with backoff, marks devices offline, expires OTPs
- [ ] Internal `send` / `otp` routes require service key
