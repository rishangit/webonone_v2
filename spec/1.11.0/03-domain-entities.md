# 03 — Domain entities (1.11.0)

MySQL schema design for the Data catalog. All primary keys: `CHAR(21)` (nanoid-style, matching platform convention). Timestamps: `created_at`, `updated_at` (UTC).

## Shared conventions

| Column | Type | Notes |
|--------|------|-------|
| `id` | `CHAR(21)` PK | Generated server-side |
| `name` | `VARCHAR(255)` NOT NULL | Unique per entity type (case-insensitive compare in app) |
| `description` | `TEXT` NULL | |
| `status` | `ENUM('verified','pending')` NOT NULL DEFAULT `'pending'` | |
| `created_at` | `DATETIME` | |
| `updated_at` | `DATETIME` | |

## Tags — `data_tags`

| Column | Type | Notes |
|--------|------|-------|
| `color` | `VARCHAR(7)` NOT NULL | Hex `#RRGGBB` |

Indexes: `status`, unique on `LOWER(name)` via app validation.

## Units of measure — `data_units`

| Column | Type | Notes |
|--------|------|-------|
| `symbol` | `VARCHAR(32)` NOT NULL | e.g. `kg`, `m²` |
| `base_unit_id` | `CHAR(21)` NULL FK → `data_units.id` | Self-reference; null = is base |
| `is_base` | `BOOLEAN` NOT NULL DEFAULT false | True when canonical unit |

Constraint: if `is_base` true, `base_unit_id` must be null.

## Attributes — `data_attributes`

| Column | Type | Notes |
|--------|------|-------|
| `value_type` | `ENUM('number','text')` NOT NULL | |
| `unit_id` | `CHAR(21)` NULL FK → `data_units.id` | Required when `value_type = 'number'`; optional for text |

## Products — `data_products`

Core row only; tags and attributes via junction tables.

## Services — `data_services`

Same shape as products.

## Spaces — `data_spaces`

Same shape as products.

## Junction tables

### Tag links (M:N)

| Table | Columns |
|-------|---------|
| `data_product_tags` | `product_id`, `tag_id` — composite PK |
| `data_service_tags` | `service_id`, `tag_id` |
| `data_space_tags` | `space_id`, `tag_id` |

### Attribute values (M:N with payload)

| Table | Columns |
|-------|---------|
| `data_product_attributes` | `product_id`, `attribute_id`, `value_text` TEXT NULL, `value_number` DECIMAL(18,6) NULL |
| `data_service_attributes` | `service_id`, `attribute_id`, `value_text`, `value_number` |
| `data_space_attributes` | `space_id`, `attribute_id`, `value_text`, `value_number` |

Validation: exactly one of `value_text` / `value_number` populated per attribute's `value_type`.

## Entity relationships

```text
data_units ←── data_attributes.unit_id
data_tags ←── M:N ──→ products | services | spaces
data_attributes ←── M:N (with values) ──→ products | services | spaces
```

## Status workflow

- New records default to `pending`.
- `PATCH` or dedicated action may set `status: verified` (super_admin).
- List filters accept `status=verified|pending|all` (default `all`).

## Delete rules

- Soft-delete **not** in 1.11.0 — hard delete with FK checks.
- Cannot delete UOM referenced by attributes.
- Cannot delete attribute referenced by product/service/space links.
- Deleting product/service/space cascades junction rows.

## User roles (local copy) — `data_user_roles`

| Column | Type |
|--------|------|
| `user_id` | `CHAR(21)` PK |
| `role` | `ENUM('super_admin','company_admin','member')` |
| `company_id` | `CHAR(21)` NULL |
| `updated_at` | `DATETIME` |

Upsert on first authenticated request from JWT + WebOnOne role sync endpoint (optional Phase 5).

## Migration file naming

```text
data/backend/migrations/20260703000001_create_data_base_tables.ts
data/backend/migrations/20260703000002_create_data_junction_tables.ts
```

## Acceptance

- [ ] Migrations create all tables with FK constraints
- [ ] Seed script optional: 2–3 sample tags, one UOM, one attribute (dev only)
- [ ] Zod schemas mirror DB constraints on API layer
