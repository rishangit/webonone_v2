---
name: core-hosted-peer-dialog
description: >-
  When a peer service runs inside a parent iframe and opens a dialog, delegate
  to the parent shell — never open CustomDialog inside the iframe. Use for any
  create/edit/form/wizard/selection dialog in Identity, Email, Data, SMS (or any
  peer) embedded in WebOnOne. Peer-dialog bridge, /embed/dialogs body routes,
  host Cancel / optional Previous / primary footer.
---

# Core-hosted peer dialog

## Rule

If the peer is loaded in a parent iframe (`parentOrigin` set) and opens a dialog, **do not** render local `CustomDialog` inside the iframe. Request the **parent** to open chrome at shell level so the overlay covers sidebar + header + main.

**Parity (required):** hosted and standalone must look and behave the same — same **header** (title, description), same **body**, same **footer** (Cancel + primary labels), and same **size** (`sizeWidth` / `sizeHeight`). Pass those values in the peer-dialog request; do not invent a different layout for embed.

```text
Peer page (iframe)  →  peer-dialog-request  →  Parent shell CustomDialog
                         (title, description, sizes, footer labels)
Peer body (/embed/dialogs/…)  ←  same fields as standalone  ←  host header + footer
```

Standalone (no parent): local `CustomDialog` as usual. Chrome sizing/footer: [dialog-windows.mdc](../../rules/dialog-windows.mdc). Message contract: [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc).

**Not this skill:** Media picker/crop (`media-dialog-*`).

## Chrome split

| Region | Owner | Must match standalone |
|--------|--------|------------------------|
| Header (title, description) | Parent host from request | Same strings; sync description via `peer-dialog-busy` when it changes (wizards) |
| Size (`sizeWidth` / `sizeHeight`) | Parent host from request | Same constants |
| Footer Cancel + optional secondary + primary | Parent host (`secondary` → `peer-dialog-secondary`, primary → `peer-dialog-submit`) | Same labels (wizards: Previous + Next/Save) |
| Body | Peer `/embed/dialogs/…` — fields/list only; **no** footer buttons | Same shared body component |

Wizards: pass `secondaryLabel: 'Previous'` when step > 1; update `description`, `submitLabel`, and `secondaryLabel` with `sendPlatformPeerDialogBusy` as the step changes. Never put Previous/Next/Save in the embed body. Body still shows `Step {n} of {total} — {Title}` + progress bar per [dialog-windows.mdc](../../rules/dialog-windows.mdc).

## Recipe

1. Share one **body** between standalone and embed (`chrome: 'dialog' | 'embed-page'`).
2. Standalone: local `CustomDialog` with title, description, sizes, Cancel + primary.
3. Add peer route `/embed/dialogs/<feature>/…` (slim layout; no `FeaturePage`; no footer).
4. Opener: `resolvePlatformEmbedParentOrigin` → `useRequestPlatformPeerDialog` with the **same** title, description, sizes, and footer labels as standalone; if `isHosted`, return `null`.
5. Embed body: `usePlatformPeerDialogSubmit` → save → complete/dismiss/busy.
6. Hosted `onResult`: refresh list / apply payload.

```tsx
const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

const { isHosted } = useRequestPlatformPeerDialog({
  parentOrigin: chrome === 'dialog' ? parentOrigin : null,
  open: chrome === 'dialog' && open,
  path: '/embed/dialogs/…',
  title,           // same as standalone CustomDialog
  description,     // same when used
  submitLabel,     // same primary footer label
  secondaryLabel,  // same when used (e.g. wizard Previous)
  cancelLabel,     // same when not default Cancel
  sizeWidth,       // same as standalone
  sizeHeight,      // same as standalone
})
if (isHosted) return null
```

**Opener parentOrigin:** always `resolvePlatformEmbedParentOrigin` (URL + session). Never `getPlatformEmbedParentOrigin` alone — client nav drops query params and the dialog would open inside the iframe.

Embed body listens with `usePlatformPeerDialogSubmit({ onSubmit, onSecondary? })` and syncs host chrome via `sendPlatformPeerDialogBusy(..., { description, secondaryLabel })`.

## Selection dialog list rows

Picker / selection bodies (tag select, library select, user pick) must show the **selected item**: `itemListRowActiveClassName` **and** Lucide `Check` on the right. See [selection-dialog-list.mdc](../../rules/selection-dialog-list.mdc). Canonical: `TagPickerPanel`.

## Nested create from a selection dialog

Do **not** open create chrome inside the picker iframe. Outer body sends `peer-dialog-nested-request`; host opens a sibling `CustomDialog` + create `/embed/dialogs/…` body; result/cancel posts back to the outer iframe.

## Forbidden

- Local `CustomDialog` inside the page iframe when `parentOrigin` is set
- Different title, description, footer labels, or size for hosted vs standalone
- `getPlatformEmbedParentOrigin` alone on list/page openers
- Footer actions inside `/embed/dialogs/…` body
- `FeaturePage` on embed dialog routes
- Per-dialog changes under `webonone-v2/` (host already allowlists `/embed/dialogs/`)

## Code

| Piece | Where |
|-------|--------|
| Resolve parent | `@webonone/platform-embed` → `resolvePlatformEmbedParentOrigin` |
| Request / submit | `useRequestPlatformPeerDialog`, `usePlatformPeerDialogSubmit` |
| Host | `webonone-v2/.../PlatformPeerDialogHost.tsx` |
| Form example | `data/.../TagFormDialog.tsx` |

## Verification

```bash
npm run type-check -w <peer>-root
```

Manual: open peer via WebOnOne → dialog covers full shell; Cancel / Previous (wizards) / primary live in host footer only. After in-iframe navigation (query may drop), create/edit still host-hosted — not clipped to `#main-content`.
