# WebOnOne Platform — Specification (1.19.0)

Company-admin Point of Sale: sell company catalog products, services, and spaces to Identity customers, record cash/card/other as paid immediately, generate a bill, keep sales history in `webonone_v2`, and show sales on each customer's Identity History tab.

**Spec No:** 1.19.0

## What changed

| Area | 1.19.0 |
|------|--------|
| Storage | `company_sales` / `company_sale_lines` / `company_sale_counters` plus `list_price` on company products, services, and spaces |
| POS | Company-admin checkout: customer + catalog lines + payment method → completed bill |
| History | Company Sales History + bill print/void |
| Identity | User History includes `sale` activity with bill detail |

## Projects affected

| Project | Role |
|---------|------|
| **WebOnOne** (`webonone-v2/`) | Schema, APIs, POS UI, catalog list price |
| **Identity** (`identity/`) | User History sale rows and bill detail |
| **platform-nav** | Sales nav group (company_admin only) |

## Out of scope

- Payment service / gateways / unpaid invoices
- Calendar event or session-token creation from POS
- Data stock decrement
- Tax/VAT, website self-checkout, super-admin POS

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Architecture and rules |
| [02-schema-and-apis.md](./02-schema-and-apis.md) | Tables and REST |
| [03-pos-and-history.md](./03-pos-and-history.md) | UI and user history |

## Revision history

- **2026-08-19** — Company POS v1.
