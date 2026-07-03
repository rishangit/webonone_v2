# 04 — CRUD API (1.11.0)

Versioned REST under `/api/v1`. All routes except `/health` require `Authorization: Bearer <JWT>`.

## Common list query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Case-insensitive search on `name` and `description` |
| `status` | `verified` \| `pending` | all | Filter by status |
| `page` | number | 1 | 1-based page index |
| `pageSize` | number | 20 | Max 100 |
| `sort` | string | `name` | `name`, `-name`, `updated_at`, `-updated_at` |

### Response envelope

```json
{
  "items": [ /* entity DTOs */ ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

## Tags — `/api/v1/tags`

| Method | Path | Body | Auth |
|--------|------|------|------|
| GET | `/tags` | — | read |
| GET | `/tags/:id` | — | read |
| POST | `/tags` | `{ name, description?, color, status? }` | super_admin |
| PUT | `/tags/:id` | full replace | super_admin |
| PATCH | `/tags/:id` | partial | super_admin |
| DELETE | `/tags/:id` | — | super_admin |

`color` validation: `#` + 6 hex digits.

## Units of measure — `/api/v1/units`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/units` | List with `q`, `status`, pagination |
| GET | `/units/:id` | Detail |
| POST | `/units` | `{ name, symbol, is_base?, base_unit_id? }` |
| PUT/PATCH/DELETE | `/units/:id` | Standard CRUD |

Extra filter: `is_base=true|false`.

## Attributes — `/api/v1/attributes`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/attributes` | Filter `value_type=number|text` |
| POST | `/attributes` | `{ name, description?, value_type, unit_id?, status? }` |

When `value_type=number`, `unit_id` required.

## Products — `/api/v1/products`

DTO includes nested `tags: TagSummary[]` and `attributes: { attribute_id, name, value_text?, value_number? }[]`.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/products` | Filter `tag_id` (repeatable) |
| POST | `/products` | `{ name, description?, status?, tag_ids?, attributes? }` |

`attributes` array: `{ attribute_id, value_text? | value_number? }`.

## Services — `/api/v1/services`

Mirror products routes under `/services`.

## Spaces — `/api/v1/spaces`

Mirror products routes under `/spaces`.

## Validation

- Zod schemas in `data/backend/src/schemas/*.schema.ts`
- `validateBody` middleware on POST/PUT/PATCH
- Inline field errors shape: `{ field, message }[]` → 400

## Error responses

| Code | When |
|------|------|
| 400 | Validation failure |
| 401 | Missing/invalid JWT |
| 403 | Insufficient role |
| 404 | Entity not found |
| 409 | Duplicate name |

## Implementation layout

```text
data/backend/src/
  routes/tags.routes.ts
  routes/units.routes.ts
  routes/attributes.routes.ts
  routes/products.routes.ts
  routes/services.routes.ts
  routes/spaces.routes.ts
  controllers/
  services/               # Knex queries, junction sync
  schemas/
```

Register routes in `server.ts` under `/api/v1`.

## Consumer contract (read-only for peers)

Other services may call Data API with user JWT or service API key (future). **1.11.0:** document read endpoints; no consumer implementation required except WebOnOne nav.

Forbidden: cross-service SQL; importing Data repositories.

## Acceptance

- [ ] OpenAPI-style route list documented in code comments or README
- [ ] All list endpoints support `q`, `status`, `page`, `pageSize`
- [ ] Product/service/space create updates junction tables atomically (transaction)
- [ ] Integration test or manual curl checklist in plan verification
