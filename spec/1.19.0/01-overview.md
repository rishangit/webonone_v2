# 1.19.0 overview

Company Point of Sale is a **WebOnOne** company-admin feature. Catalog content still lives in Data + `company_*` bindings. Sales, bills, and line snapshots live in `webonone_v2` so later catalog or price changes cannot rewrite history.

```text
Company admin POS  -->  WebOnOne API  -->  webonone_v2 (sales)
       |                      ^
       |                      |
       +--> Identity customers API
       +--> Data stock sell price (product default only)
Identity User History  -->  GET /company/me/users/:id/activity
```

Payment service remains **system subscription invoices only**. Customer online checkout and gateways stay deferred.

POS does not create calendar events or session tokens. Calendar remains booking; POS is commerce.

## Security

- Checkout and void require `company_admin` + active `company_id`.
- List/get sales and user activity require a company session (admin or member) so Identity History can load bills.
- Customer must have Identity `member` for the company.
- Catalog line items must belong to the active company.
- JWT verified locally; no per-request Identity HTTP on list/get after checkout snapshots are stored.
