# 04 — Reference counts

Each catalog entity exposes how many times it is **used** (referenced) inside the Data database. This informs verify/delete decisions and makes usage visible on every list row.

## Field contract

| Field | Type | Where |
|-------|------|-------|
| `referenceCount` | non-negative integer | Every list item DTO and detail DTO for all six entities |

Example list item:

```json
{
  "id": "…",
  "name": "Hair color",
  "status": "pending",
  "referenceCount": 3
}
```

No separate column in MySQL required for v1 — compute with `COUNT` / subqueries on read (acceptable at catalog scale). Optional denormalized column is out of scope unless performance requires it later.

## Count definitions

| Entity | `referenceCount` equals |
|--------|-------------------------|
| **Tag** | Rows in `data_product_tags` + `data_service_tags` + `data_space_tags` for this `tag_id` |
| **Unit** | Rows in `data_attributes` with `unit_id` = this unit **plus** other units with `base_unit_id` = this unit |
| **Attribute** | Rows in `data_product_attributes` + `data_service_attributes` + `data_space_attributes` for this `attribute_id` |
| **Product** | `0` in v1 (leaf catalog; no inbound FKs from other Data tables) |
| **Service** | `0` in v1 |
| **Space** | `0` in v1 |

Products / services / spaces remain in the contract (`referenceCount: 0`) so the UI is uniform. Future specs may count cross-service usage via events; **not** in 1.13.5.

## Delete interaction

Existing FK / service checks stay:

- Cannot delete unit referenced by attributes (or as base unit)
- Cannot delete attribute referenced by product/service/space links
- Tags: if junctions exist, either cascade on product delete only, or block tag delete when `referenceCount > 0` — **prefer block delete when `referenceCount > 0`** for tags (align with attributes/units messaging)

API already returns `409` `FK_CONSTRAINT` with message “Cannot delete: referenced by other records”. UI may show `referenceCount` in the confirm dialog copy, e.g. “Used by 3 records.”

## UI display

### List rows

Show a compact secondary line or chip:

```text
References: {referenceCount}
```

or abbreviated `Refs: N` next to the status badge. Same pattern on all six lists.

### Detail / editor

Optional read-only line under the title: **References: N**. Not editable.

### Empty / zero

Show `0` (do not hide) so owners and admins learn the metric exists.

## Implementation notes

| Layer | Approach |
|-------|----------|
| Repository / service list | Join or correlated subquery per entity type; include in mapped DTO |
| Detail GET | Same count helper as list |
| Create response | `referenceCount: 0` |
| Performance | Index existing FK columns; avoid N+1 by aggregating in SQL for list pages |

Shared helper sketch:

```typescript
async function countTagReferences(tagId: string): Promise<number>
async function countUnitReferences(unitId: string): Promise<number>
async function countAttributeReferences(attributeId: string): Promise<number>
```

## Acceptance

- [ ] List + detail JSON includes `referenceCount` for all six entities
- [ ] Tag / unit / attribute counts match junction / FK reality after linking in product/service/space editors
- [ ] New creates show `0`
- [ ] List UI shows the count on every entity
- [ ] Delete still blocked when referenced; message remains clear
