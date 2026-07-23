---
name: core-hosted-peer-dialog
description: >-
  Opens peer CustomDialogs at WebOnOne shell level (not inside #main-content
  iframe). Use whenever adding or fixing a dialog/form/selection modal that
  opens while Identity, Email, Data, SMS (or any peer) is embedded in core —
  peer-dialog bridge, /embed/dialogs body routes, host Cancel/primary footer.
---

# Core-hosted peer dialog

**When to use (mandatory):** Any `CustomDialog` / form / selection dialog that opens from a peer page running inside WebOnOne `#main-content` must use this recipe so the overlay dims the **whole** shell (sidebar + header + main). Do **not** render local `CustomDialog` inside the page iframe when `parentOrigin` is set.

**Not this skill:** Media picker/crop → `media-dialog-*` + `PlatformMediaDialogHost`. Consumer-owned Identity user picker iframe → `IdentityUserPickerFrame` (different contract).

## Rules

- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — peer-dialog contract
- [dialog-windows.mdc](../../rules/dialog-windows.mdc) — CustomDialog chrome, footer, sizing

## Chrome split

| Region | Owner |
|--------|--------|
| sizeWidth / sizeHeight / title / description | Host (`PlatformPeerDialogHost`) from request |
| Footer Cancel + primary | Host — labels from request; primary posts `peer-dialog-submit` |
| Body | Peer route `/embed/dialogs/…` — fields/list only; **no** footer buttons |

## Nested create from a selection dialog (SelectTag pattern)

When a **selection** dialog (picker) needs **Add new**, do **not** open create chrome inside the picker iframe.

| Context | Pattern |
|---------|---------|
| Consumer-owned picker (e.g. `SelectTag`) | Parent owns both `CustomDialog`s; picker iframe + create iframe (`DataTagCreateFrame`) |
| Peer-dialog selection (e.g. Identity Add user) | Outer peer-dialog on `PlatformPeerDialogHost`; create via `peer-dialog-nested-request` → host sibling `CustomDialog` (`stackLevel={1}`) + create `/embed/dialogs/…` body |

**Flow (peer-dialog nested):**

1. Outer body: `sendPlatformPeerDialogNestedRequest` with create path, title, sizes, `submitLabel`.
2. Host opens sibling dialog; Create footer → `peer-dialog-submit` into create iframe.
3. Create body: `usePlatformPeerDialogSubmit` + `sendPlatformPeerDialogComplete`.
4. Host posts `peer-dialog-nested-result` / `nested-cancel` to the **outer** iframe; outer applies selection or completes.

**References:** `ui-kit/showcase/.../SelectTagDemo.tsx`, `webonone-v2/.../PlatformPeerDialogHost.tsx`, `identity/.../AddCompanyUserDialog.tsx` + `/embed/dialogs/users/create`.

**Forbidden:** local create `CustomDialog` inside `/embed/dialogs/…` picker body.

## Recipe (peer only — no WebOnOne change for simple forms)

1. Extract **body** shared by standalone + embed (`chrome: 'dialog' | 'embed-page'` or ui-kit `chrome: 'body'`).
2. Standalone: local `CustomDialog` with same title, sizes, Cancel + primary footer.
3. Add route `/embed/dialogs/<feature>/…` under the peer `App` (slim layout; no `FeaturePage`; no footer in iframe).
4. List/page opener: `useRequestPlatformPeerDialog(...)` when embedded; if `isHosted`, render `null`.
5. Embed page: `usePlatformPeerDialogSubmit` → save; busy/complete/dismiss.
6. On hosted `onResult`: refresh list / apply payload.

**Selection + nested create** also needs the nested-request messages above (host already supports them — still peer-only for new create routes).

Path allowlist is any safe path under `/embed/dialogs/`.

## References

| Kind | Path |
|------|------|
| Request hook | `packages/platform-embed/src/useRequestPlatformPeerDialog.ts` |
| Submit hook | `packages/platform-embed/src/usePlatformPeerDialogSubmit.ts` |
| Host | `webonone-v2/frontend/src/features/shell/PlatformPeerDialogHost.tsx` |
| Form (Email) | `email/frontend/src/features/templates/components/TemplateFormDialog.tsx` |
| Form (Data) | `data/frontend/src/features/tags/components/TagFormDialog.tsx` |
| Selection (Identity) | `identity/frontend/src/features/users/components/AddCompanyUserDialog.tsx` + `/embed/dialogs/users/add` + nested `/embed/dialogs/users/create` |
| Nested create (tags) | `SelectTagDemo.tsx` / `DataTagCreateFrame` — parent sibling dialogs |

## Forbidden

- Local `CustomDialog` inside `#main-content` when embedded and the dialog should cover the shell
- Footer Cancel/Save/Done inside the embed-page body
- Per-dialog changes under `webonone-v2/` for new peer dialogs
- Putting `FeaturePage` on `/embed/dialogs/…` routes

## Verification

```bash
npm run type-check -w <peer>-root
# if ui-kit body chrome changed:
npm run build -w @webonone/ui-kit
```

Manual: open peer via WebOnOne → open dialog → overlay covers sidebar + header; Cancel/primary live in host footer only.
