# 07 — Implementation Plan

Phased delivery for **1.5.0** on branch **`spec/1.5.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.5.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.5.0` |
| Scope | `identity/`, `media/`, `packages/media-embed/`, `webonone-v2/` |

---

## Phase 0 — Spec (complete)

- [x] `spec/1.5.0/*` documentation
- [x] Branch `spec/1.5.0`

---

## Phase 1 — Media selector locked crop (0.5 day)

**Goal:** Support `cropAspectPresets` query param on `/selector` embed.

| Task | Detail |
|------|--------|
| Parse `cropAspectPresets` in `useEmbedMode` | Comma-separated list, default all presets |
| Pass to `ImageCropDialog` | `aspectPresets` prop; hide radio group when single preset |
| `buildMediaSelectorUrl` | Add `cropAspectPresets?: CropAspectPreset[]` |
| Export types | `packages/media-embed/src/types.ts` |

**Exit criteria:** Selector with `cropAspectPresets=1:1` shows crop UI without ratio switcher.

---

## Phase 2 — Identity profile view/edit (2–3 days)

| Task | Priority |
|------|----------|
| `mediaConfig.ts` + env example | P0 |
| `ProfileView` read-only layout | P0 |
| Mode toggle in `ProfileForm` | P0 |
| `ProfileAvatarEditor` + selector modal | P0 |
| Wire `onSelect` → pending `avatarUrl` → save | P0 |
| Add `@webonone/media-embed` + build chain | P0 |

**Exit criteria:** Manual test on `/profile` — view → edit → pick image → save → view shows new avatar.

---

## Phase 3 — WebOnOne demo removal (0.5 day)

| Task | Priority |
|------|----------|
| Remove nav item | P0 |
| Remove route + page | P0 |
| Delete unused demo components | P0 |

**Exit criteria:** No media demo in UI; type-check passes.

---

## Phase 4 — Verification (0.5 day)

```bash
npm run build -w @webonone/media-embed
npm run type-check -w identity-root
npm run type-check -w webonone-v2-root
npm run type-check -w media-root
```

Manual QA:

| Check | Expected |
|-------|----------|
| Profile view mode | Large image, read-only fields |
| Edit → image | Selector at `/root/users/{id}`, 1:1 crop only |
| Save | `avatarUrl` persisted |
| WebOnOne nav | No Media demo |

---

## Acceptance checklist (release)

### Identity

- [ ] Default view mode on `/profile`
- [ ] Edit mode with Media selector for avatar
- [ ] `folderPath=/root/users/{userId}`; locked 1:1 crop
- [ ] `avatarUrl` saved via `PATCH /me`

### Media / media-embed

- [ ] `cropAspectPresets` query + URL builder
- [ ] `npm run build -w @webonone/media-embed` passes

### WebOnOne

- [ ] Media demo route and nav removed
- [ ] No dead imports

### Security

- [ ] JWT via `sendMediaInit` only
- [ ] `parentOrigin` validated in Media embed
- [ ] No tokens in URLs

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec No 1.5.0 improve the profile page | 86ey2n76k | Phases 1–4 |
