# Schema and APIs

## Tables (`webonone_v2`)

`company_products.list_price`, `company_services.list_price`, `company_spaces.list_price` — DECIMAL(18,2) NULL. Company-owned even when the item is `linked`.

`company_sales` — bill header: `bill_number` (unique per company, `BILL-000123`), `customer_user_id` (Identity copy), name/email snapshots, `status` (`completed` \| `void`), `payment_method` (`cash` \| `card` \| `other`), `currency` default `LKR`, `subtotal`/`total`, `notes`, `created_by_user_id`.

`company_sale_lines` — `item_kind` (`product` \| `service` \| `space`), `catalog_item_id`, `library_entity_id`, `name_snapshot`, quantity, unit price, line total.

`company_sale_counters` — per-company sequence allocated in the create transaction.

## REST (`/api/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/company/me/sales` | company session |
| GET | `/company/me/sales/:id` | company session |
| POST | `/company/me/sales` | company admin |
| POST | `/company/me/sales/:id/void` | company admin |
| PATCH | `/company/me/catalog/:kind/:id/pricing` | company admin |

Create body:

```json
{
  "customerUserId": "…",
  "paymentMethod": "cash",
  "notes": null,
  "lines": [
    { "itemKind": "product", "catalogItemId": "…", "quantity": 1, "unitPrice": 500 }
  ]
}
```

`GET /company/me/users/:userId/activity` includes `type: "sale"` for rows where `customer_user_id` matches.
