# Payment agent

Scope: `payment/frontend`, `payment/backend`, `payment/backend/migrations`.

Skill: [.cursor/skills/payment-agent/SKILL.md](../skills/payment-agent/SKILL.md)

## Responsibilities

- Standalone Payment microservice: system subscription billing, invoices, activation sync.
- Super-admin invoices list (all companies); company_admin own-company read.
- Admin SPA using `@webonone/ui-kit` list and form patterns.
- JWT verification locally (same `JWT_SECRET` as Identity/WebOnOne).
- Internal API via `X-Payment-Service-Key` for WebOnOne company upsert.

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3017 |
| Backend | 4017 |

Database: `webonone_payment`

## Do not

- Implement login UI in the admin SPA (Identity owns auth).
- Share database with other services.
- Call Identity BE per request.
- Implement customer payments or payment gateways in 1.16.0.
