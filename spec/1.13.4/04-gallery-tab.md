# 04 — Gallery tab

The **Gallery** tab manages company visual assets: a single **logo** and a **multi-image gallery**. Both use the Media service via the platform Media dialog / embed contract ([05](./05-media-paths-and-integration.md)).

## Composition

```text
Gallery tab
  Card 1 — Company logo
  Card 2 — Gallery images
```

Use UI Kit `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent`. Stack with `gap-6`.

---

## Card 1 — Company logo

| Item | Detail |
|------|--------|
| Title | **Company logo** |
| Description | Shown on company lists and profile identity surfaces |
| View | Current logo image, or empty placeholder (“No logo yet”) |
| Actions (owner / SA) | **Upload** / **Replace** opens Media selector (single image); optional **Remove** clears `logoUrl` |
| Members | View only — no upload / remove controls |

### Behavior

| Step | Detail |
|------|--------|
| Open Media | Single-select, `accept: image/*`, upload allowed; crop **1:1** preferred (match Identity profile) |
| Path | Scope + folderPath for **profile** — see [05](./05-media-paths-and-integration.md) |
| On select | Set pending preview from selected item URL; persist via `PATCH` company `{ logoUrl }` (and optional `logoMediaId` if added) |
| Remove | `PATCH` `{ logoUrl: null }` (and clear media id if stored) |
| Lists | All Companies / Companies rows already render `logoUrl` — they pick up the new URL after detail refresh / list reload |

### Empty state

Muted placeholder box + short CTA copy (“Upload a company logo”) when editable; view-only empty for members.

---

## Card 2 — Gallery images

| Item | Detail |
|------|--------|
| Title | **Gallery** |
| Description | Additional company images (marketing, office, products, etc.) |
| View | Responsive grid/row of thumbnails from stored gallery refs |
| Actions (owner / SA) | **Add images** opens Media selector (**multi**); per-image **Remove** |
| Members | View grid only |

### Behavior

| Step | Detail |
|------|--------|
| Open Media | Multi-select, `accept: image/*`, upload allowed; free or common aspect presets OK (no locked 1:1 required) |
| Path | Scope + folderPath for **gallery** — see [05](./05-media-paths-and-integration.md) |
| On select | Append selected items to gallery refs (dedupe by `mediaId`); `PATCH` company gallery payload |
| Remove | Drop one ref from the array; `PATCH` updated list |
| Order | Preserve selection / array order for v1; drag-reorder out of scope |

### Empty state

Empty grid placeholder + “Add gallery images” when editable.

### Limits (v1 defaults)

| Limit | Value |
|-------|--------|
| Max gallery images | 24 (enforce in UI + Zod; adjustable later) |
| File types | Images only (`image/*`) |

---

## Persistence (WebOnOne)

| Asset | Storage |
|-------|---------|
| Logo | Existing `companies.logo_url` (`logoUrl` in API) |
| Gallery | New nullable JSON column, e.g. `gallery_images` — array of `{ mediaId: string, url: string }` (preferred) **or** `string[]` of URLs |

Extend `GET` / `PATCH /api/v1/company/:id` detail DTO:

```ts
galleryImages: Array<{ mediaId: string; url: string }>
```

PATCH accepts partial `galleryImages` (full replacement array for that field). Members cannot PATCH.

Migration under `webonone-v2/backend/migrations`. Media remains source of blobs; WebOnOne stores refs for fast display.

---

## Permissions

| Actor | Logo | Gallery |
|-------|------|---------|
| Company owner (`company_admin`) | View + upload/replace/remove | View + add/remove |
| Super admin | Same as owner | Same as owner |
| Member | View | View |
| Non-member (not SA) | No access (page error) | No access |

---

## Suggested components

| Path | Role |
|------|------|
| `…/companies/components/CompanyLogoCard.tsx` | Logo card |
| `…/companies/components/CompanyGalleryCard.tsx` | Gallery card |
| `…/companies/components/CompanyMediaSelector.tsx` (or hook) | Open Media dialog with correct scope/path/mode |
| `…/media/utils/mediaConfig.ts` | Update path builders (replace pending `/logo` helpers) |

---

## Acceptance

1. Gallery tab shows Logo and Gallery cards.
2. Owner can upload/replace logo; `logoUrl` updates; image appears on card and list rows after refresh.
3. Owner can add multiple gallery images and remove one; refs persist on GET after PATCH.
4. Files land under the correct Media folder paths ([05](./05-media-paths-and-integration.md)).
5. Members see images but no mutating controls.
6. Type-check green for webonone-v2.
