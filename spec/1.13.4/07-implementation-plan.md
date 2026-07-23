# 07 — Implementation Plan

Phased delivery for **1.13.4** on branch **`spec/1.13.4`**.

---

## Branch workflow

```bash
git checkout master   # or merge base that includes 1.13.2 company profile
git pull
git checkout -b spec/1.13.4
```

| Rule | Detail |
|------|--------|
| Base | Branch that includes 1.13.2 Company profile page |
| Spec branch | `spec/1.13.4` |
| Scope | `webonone-v2/frontend` + `webonone-v2/backend` (+ migration) |
| Media | Config/path usage only — no Media service code required |
| Identity / UI Kit | None required |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.13.4/*` documentation
- [ ] Branch `spec/1.13.4`
- [ ] ClickUp parent + subtasks when tracking is required

---

## Phase 1 — Tabs shell + Profile tab

**Goal:** [02-company-profile-tabs.md](./02-company-profile-tabs.md), [03-profile-tab.md](./03-profile-tab.md)

| Task | Detail |
|------|--------|
| Tabs | Add Profile \| Gallery to `CompanyProfilePage` |
| Move | Existing three cards into Profile tab panel |
| Chrome | Keep FeaturePage title / back / loading / errors |

**Exit criteria:** Default Profile tab matches pre-change profile UX.

**Verify:** `npm run type-check -w webonone-v2-root`

---

## Phase 2 — Backend gallery refs

**Goal:** [04-gallery-tab.md](./04-gallery-tab.md) persistence section

| Task | Detail |
|------|--------|
| Migration | Add `gallery_images` JSON (nullable) on `companies` |
| DTO | Include `galleryImages` on GET detail |
| PATCH | Accept `galleryImages` array; owner / SA only |
| Zod | Validate max length / URL / mediaId shape |

**Exit criteria:** PATCH gallery then GET returns same refs; logo PATCH unchanged.

---

## Phase 3 — Media path helpers

**Goal:** [05-media-paths-and-integration.md](./05-media-paths-and-integration.md)

| Task | Detail |
|------|--------|
| Helpers | `buildCompanyMediaScope`, `buildCompanyProfileFolderPath`, `buildCompanyGalleryFolderPath` |
| Cleanup | Stop using pending `/logo` helpers for Gallery tab flows |

**Exit criteria:** Paths match `/companies/{id}/profile` and `/companies/{id}/gallery`.

---

## Phase 4 — Gallery tab UI

**Goal:** [04-gallery-tab.md](./04-gallery-tab.md)

| Task | Detail |
|------|--------|
| Logo card | Preview + upload/replace/remove → PATCH `logoUrl` |
| Gallery card | Grid + add multi + remove → PATCH `galleryImages` |
| Media open | Platform Media dialog (or Identity-style selector) with correct scope/path/mode |
| Permissions | Hide mutate actions for non-owners |

**Exit criteria:** Manual acceptance below.

**Verify:** `npm run type-check -w webonone-v2-root`

---

## Acceptance checklist

- [ ] Profile and Gallery tabs on both company profile routes
- [ ] Profile tab: three cards view/edit/save unchanged
- [ ] Logo upload → Media profile folder → `logoUrl` updated
- [ ] Multi gallery upload → Media gallery folder → refs persisted
- [ ] Remove logo / remove gallery image works
- [ ] Member view-only on Gallery
- [ ] Unauthorized company → error, no Media open
- [ ] Type-check green

## Local smoke

```bash
npm run dev:webonone
npm run dev:media
npm run migrate -w @webonone/webonone-backend   # if package script name differs, use webonone-v2 migrate
```

1. Open All Companies → company profile → Profile tab OK.
2. Gallery → upload logo → confirm list thumbnail.
3. Add 2+ gallery images → refresh → still present.
4. Confirm Media UI lists files under the two folder paths for that company scope.
