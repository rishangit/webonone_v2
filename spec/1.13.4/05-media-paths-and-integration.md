# 05 — Media paths and integration

Company logo and gallery files are owned by the **Media** service. WebOnOne only stores **refs** (`logoUrl`, `galleryImages`) and opens embeds with the correct **scope** + **folderPath**.

## Path contract (required)

| Use | Media `folderPath` | Notes |
|-----|--------------------|--------|
| Profile / logo images | `/companies/{companyId}/profile` | Single logo (and any profile-slot images) |
| Gallery images | `/companies/{companyId}/gallery` | Multiple images |

`{companyId}` is the WebOnOne company id (`CHAR(21)` nanoid) from the route param.

### Scope

| Item | Value |
|------|--------|
| Scope | `webonone:company:{companyId}` |

Aligns with Media scope convention `{service}:{resourceType}:{resourceId}` ([1.1.0 overview](../1.1.0/01-overview.md)).

```text
scope:      webonone:company:{companyId}
logo:       folderPath=/companies/{companyId}/profile
gallery:    folderPath=/companies/{companyId}/gallery
```

### Config helpers (WebOnOne)

Update `webonone-v2/frontend/src/features/media/utils/mediaConfig.ts` (replace pending-user logo helpers for this feature):

```ts
export function buildCompanyMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

export function buildCompanyProfileFolderPath(companyId: string): string {
  return `/companies/${companyId}/profile`
}

export function buildCompanyGalleryFolderPath(companyId: string): string {
  return `/companies/${companyId}/gallery`
}
```

Env remains peer-origin only: `VITE_MEDIA_ORIGIN` (existing). Do **not** add per-route Media URL env vars.

---

## Embed / dialog integration

Prefer the **platform Media dialog host** already wired in WebOnOne (`PlatformMediaDialogHost` + `media-dialog-*` messages) so Media UI dims the core shell. Fallback: local `CustomDialog` + `MediaSelectorFrame` (Identity profile pattern) only if the host contract cannot supply multi-select for gallery.

Follow [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md) and [../1.5.0/02-identity-profile-page.md](../1.5.0/02-identity-profile-page.md).

### Logo (single)

| Option | Value |
|--------|--------|
| Mode | `single` |
| Accept | `image/*` |
| Upload | Allowed |
| Crop | Prefer locked **1:1** (`cropAspectPresets: ['1:1']`) |
| Scope / folderPath | Company scope + **profile** path |

On select → `PATCH` `{ logoUrl: item.url }` (store `mediaId` if column/JSON added).

### Gallery (multi)

| Option | Value |
|--------|--------|
| Mode | `multi` |
| Accept | `image/*` |
| Upload | Allowed |
| Crop | Optional; not locked to 1:1 |
| Scope / folderPath | Company scope + **gallery** path |

On select → merge into `galleryImages` → `PATCH`.

### Auth handoff

- Parent sends JWT via Media init (`sendMediaInit` / host equivalent) with the signed-in user’s access token.
- Validate `event.origin` against Media origin allowlist; never `postMessage('*')`.
- Never put tokens in Media iframe query strings.

### Access control (consumer responsibility)

Media does not query WebOnOne’s company membership. WebOnOne **must** only open logo/gallery embeds when the current user may edit that company (owner or super admin). View-only users never open the selector.

---

## Registration / pending companies

Existing pending helpers (`webonone:company:pending:{userId}`, `/logo`) may remain for **pre-id** registration flows if still used. Once a company id exists, **all** profile/gallery uploads for that company use the paths in this doc — do not keep writing post-create logos into the pending folder.

If registration still uploads a logo before `companyId` exists, either:

1. Skip logo until Gallery tab after create, or  
2. Upload to pending, then on create success re-upload / move is **out of scope** — prefer (1) for 1.13.4 simplicity.

---

## Backend notes

| Layer | Change |
|-------|--------|
| Media BE | None required — folderPath is already a string path within scope |
| WebOnOne BE | Persist `logoUrl` (exists) + `galleryImages` ([04](./04-gallery-tab.md)); no blob storage |
| WebOnOne FE | Path builders + Gallery tab Media open/save |

---

## Security checklist

- [ ] Scope always includes the route `companyId` (no cross-company folder from client tampering without authz — still gate open by membership)
- [ ] Only owners / SA open mutating Media dialogs
- [ ] Origin checks on Media messages
- [ ] No JWT in URLs
- [ ] Gallery/logo URLs stored as HTTPS Media CDN/API URLs already returned by Media select payload

---

## Acceptance

1. Logo uploads appear under Media listing for `folderPath=/companies/{id}/profile` within `webonone:company:{id}`.
2. Gallery uploads appear under `/companies/{id}/gallery` for the same scope.
3. Config helpers are the single source of path strings (no hard-coded paths in card components).
4. Members cannot open upload selectors.
5. Pending `/logo` path is not used for an existing company’s Gallery tab uploads.
