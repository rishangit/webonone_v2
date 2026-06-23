# 05 — Dialogs (Dialogs tab)

Dedicated tab for **`CustomDialog`** (1.3.0 primary API), low-level **`Dialog`** primitives (1.2.0, internal/legacy), and **`AlertDialog`** (1.3.0, strict non-dismissible confirms).

Baseline: [../1.2.0/06-ui-kit-extensions.md](../1.2.0/06-ui-kit-extensions.md).

---

## Which dialog to use

| Use | Component | Notes |
|-----|-----------|-------|
| **All feature dialogs** (forms, wizards, selection, delete, previews) | **`CustomDialog`** | Default — do not compose raw Radix primitives in product code |
| Strict non-dismissible destructive confirm (no overlay/Escape dismiss) | **`AlertDialog`** | Optional when `CustomDialog` guards are insufficient |
| Low-level escape hatch / CustomDialog internals | `Dialog`, `DialogContent`, … | **Not** for feature pages when `CustomDialog` applies |

**Rule (all services):** import `CustomDialog` from `@webonone/ui-kit`. Do **not** use raw Radix/HTML dialog primitives in feature code when `CustomDialog` can be used.

---

## CustomDialog — component behavior and sizing

Export: `CustomDialog` from `@webonone/ui-kit`  
Implementation: `ui-kit/package/src/components/CustomDialog.tsx` (Radix Dialog wrapper).

### What CustomDialog is

`CustomDialog` is a Radix Dialog wrapper that provides a consistent app shell:

- **Overlay:** fixed full-screen, `bg-black/50`, backdrop blur, `z-[100]`
- **Centered panel:** flex-centered in viewport with `px-2 py-2 sm:px-4 sm:py-4` outer padding
- **Shell layout:** `flex flex-col` with three optional regions:
  1. **Header** — title, description, optional icon, optional `customHeader`, close button (X)
  2. **Body** — scrollable content area (`children`)
  3. **Footer** — right-aligned action buttons (`footer` prop)

Every dialog must show a visible **header** and **footer**. Global actions (Cancel, Save, Submit, Delete, Next, Previous) belong in the **footer only**, never in the body.

### CustomDialog props

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `open` | `boolean` | — | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | — | Open change handler |
| `title` | `ReactNode` | — | Header title |
| `description` | `ReactNode` | — | Muted header description |
| `icon` | `ReactNode` | — | Optional icon beside title (e.g. Lucide `w-5 h-5`) |
| `customHeader` | `ReactNode` | — | Fully custom header (replaces default title block) |
| `footer` | `ReactNode` | — | Footer actions (**required** for global buttons) |
| `children` | `ReactNode` | — | Body content |
| `sizeWidth` | `DialogSizePreset` | `"medium"` | Dialog **width** |
| `sizeHeight` | `DialogSizePreset` | *(see below)* | Dialog **height** |
| `maxWidth` | Tailwind class string | `"max-w-lg"` | Caps or overrides width depending on mode |
| `hideHeader` | `boolean` | `false` | Hide header entirely (rare; prefer always showing header) |
| `hideCloseButton` | `boolean` | `false` | Hide X button (use for delete-style confirms) |
| `noContentPadding` | `boolean` | `false` | Remove default `p-6` body padding (full-bleed layouts) |
| `disableContentScroll` | `boolean` | `false` | Body `overflow-hidden` for custom internal scroll |
| `nestedDismissGuard` | `boolean` | `false` | When true, blocks overlay pointer/focus/Escape dismiss on this dialog (use while a nested dialog is open) |
| `className` | `string` | — | Extra classes on dialog shell |
| `id` | `string` | — | Stable root id; derives `{id}-header`, `{id}-body`, `{id}-footer` |

```typescript
type DialogSizePreset = 'small' | 'medium' | 'large' | 'xlarge' | 'auto'
```

**Forwarded Radix props** (optional): `onInteractOutside`, `onPointerDownOutside`, `onFocusOutside`, `onEscapeKeyDown`, and other `@radix-ui/react-dialog` content props pass through to the inner content node — use for delete confirms when not using `AlertDialog`. When `nestedDismissGuard` is true, those dismiss events are prevented before custom handlers run.

### Size system overview

Sizing is controlled by two independent props:

| Prop | Default | Purpose |
|------|---------|---------|
| `sizeWidth` | `"medium"` | Controls dialog **width** |
| `sizeHeight` | *(see below)* | Controls dialog **height** |
| `maxWidth` | `"max-w-lg"` | Caps or overrides width depending on mode |

**Height default logic:**

- If `sizeHeight` is provided → use it
- If `sizeHeight` is omitted and `sizeWidth === "auto"` → height defaults to `"auto"` (compact/content-sized)
- If `sizeHeight` is omitted otherwise → height defaults to the **same preset as `sizeWidth`**

**Width and height are independent** — e.g. `sizeWidth="small"` + `sizeHeight="large"` gives a narrow but tall dialog.

### Width presets (`sizeWidth`)

Percent widths are fractions of the **overlay/viewport area** (not content):

| Preset | Tailwind class | Approx. width |
|--------|----------------|---------------|
| `small` | `w-1/2` | 50% |
| `medium` | `w-2/3` | 66% |
| `large` | `w-3/4` | 75% |
| `xlarge` | `w-5/6` | ~83% |
| `auto` | `w-fit` + `maxWidth` | Content-driven width, capped by `maxWidth` |

#### `maxWidth` behavior

**When `sizeWidth="auto"`:**

- Applies `w-fit` + the `maxWidth` class directly (default `max-w-lg`)
- Use for short confirmations, delete dialogs, small alerts

**When `sizeWidth` is a percent preset (`small`–`xlarge`):**

- Uses the percent width class by default
- If `maxWidth` is set and is **not** the default `max-w-lg`, it applies as `sm:{maxWidth}` instead of the percent class (legacy override pattern)
- Some dialogs omit `sizeWidth`/`sizeHeight` and only pass `maxWidth="max-w-2xl"` — uses default `medium` height but overrides width at `sm+` breakpoints

### Height presets (`sizeHeight`)

Percent heights are fractions of the **overlay/viewport area**:

| Preset | Tailwind class | Approx. height |
|--------|----------------|----------------|
| `small` | `h-1/3` | 33% |
| `medium` | `h-1/2` | 50% |
| `large` | `h-3/4` | 75% |
| `xlarge` | `h-[90%]` | 90% |
| `auto` | `h-auto` | Grows with content |

**Viewport cap (always applied):**

- Shell: `max-h-[calc(100vh-1rem)]` — dialog never exceeds viewport minus 1rem padding

### Scroll behavior

| Mode | Body classes |
|------|----------------|
| Fixed height presets (`small`–`xlarge`) | `flex-1 min-h-0 overflow-y-auto` — body scrolls inside fixed shell |
| `auto` height | `min-h-0 shrink overflow-y-auto max-h-[calc(100vh-10rem)]` — grows with content, scrolls if too tall |
| `disableContentScroll={true}` | `overflow-hidden` (custom internal scroll areas) |

Scrollable body uses UI Kit `scrollbar-themed` utility (maps to `custom-scrollbar` intent in legacy docs).

### Common size combinations

| Use case | Recommended sizing |
|----------|-------------------|
| Simple form (few fields) | `sizeWidth="small"` + `sizeHeight="medium"` |
| Form with many fields / lists | `sizeWidth="small"` + `sizeHeight="large"` |
| Selection dialogs (users, media, products) | `sizeWidth="medium"` + `sizeHeight="large"` |
| Wizards / multi-step flows | `sizeWidth="large"` + `sizeHeight="xlarge"` |
| Read-only / preview with lots of content | `sizeWidth="large"` or `"xlarge"` |
| **Delete / confirm / short message** | `sizeWidth="auto"` + `maxWidth="max-w-md"` |
| Fixed max-width form (no percent sizing) | `maxWidth="max-w-2xl"` (optionally omit explicit size props) |

### Padding and theme (do not fight the shell)

- Header: `p-6 pb-4`, bottom border `border-[hsl(var(--glass-border))]`
- Body: `p-6` when header is shown (unless `noContentPadding`)
- Footer: `px-6 py-3`, top border, buttons right-aligned with `gap-2`
- Shell: `glass-card` utility (`bg-[hsl(var(--glass-bg))]`, blur, `border-[hsl(var(--glass-border))]`), `rounded-lg`, shadow
- Inner cards in body: `bg-[hsl(var(--glass-bg))]` + `border-[hsl(var(--glass-border))]`

All accent/neutral values come from CSS variables (`@webonone/theme`); no hardcoded brand hex in `CustomDialog.tsx`.

### Footer button standards

- All footer buttons: same height — default `h-10`
- **Cancel:** `variant="outline"`, `className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"`
- **Primary (Save/Create):** `variant="default"` (primary gradient), `h-10`, Lucide `Save` icon `w-4 h-4 mr-2` before label
- **Destructive (Delete):** `variant="destructive"`, `h-10`, Lucide `Trash2` icon where appropriate
- Do not use `w-full` or `flex-1` on footer buttons unless explicitly required

> **Note:** Legacy docs may reference `variant="accent"` — in `@webonone/ui-kit` this maps to `variant="default"` (`btn-primary-gradient`). Optional `accent` alias may be added to `buttonVariants` in 1.3.0.

### Minimal examples

#### Standard form dialog (narrow + tall)

```tsx
import { CustomDialog, Button } from '@webonone/ui-kit'
import { Save, Tag } from 'lucide-react'

<CustomDialog
  open={open}
  onOpenChange={setOpen}
  title="Add Tag"
  description="Create a new tag"
  icon={<Tag className="h-5 w-5" />}
  sizeWidth="small"
  sizeHeight="large"
  footer={
    <>
      <Button variant="outline" className="h-10 px-4" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button className="h-10">
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
    </>
  }
>
  {/* form fields — no Submit button in body */}
</CustomDialog>
```

#### Delete confirmation (CustomDialog)

```tsx
<CustomDialog
  open={open}
  onOpenChange={setOpen}
  title={`Delete ${itemName}?`}
  description="This action cannot be undone. The item will be permanently removed."
  sizeWidth="auto"
  maxWidth="max-w-md"
  hideCloseButton
  onInteractOutside={(e) => e.preventDefault()}
  onEscapeKeyDown={(e) => e.preventDefault()}
  footer={
    <>
      <Button variant="outline" className="h-10 px-4" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" className="h-10" onClick={handleDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </>
  }
>
  {/* optional short warning; no action buttons in body */}
</CustomDialog>
```

For delete flows that must use native `alertdialog` semantics and Radix non-dismiss defaults without manual guards, use **`AlertDialog`** (below).

---

## Low-level Dialog primitives (legacy / internal)

Exported from 1.2.0 for `CustomDialog` internals and gradual migration. **Do not use in feature code** when `CustomDialog` applies.

| Export | Role |
|--------|------|
| `Dialog` | Root |
| `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogBody`, `DialogFooter` | Composition primitives |
| `DialogTitle`, `DialogDescription`, `DialogClose` | Accessibility primitives |

`DialogContent` `size?: 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` remains for backward compatibility but is **superseded** by `CustomDialog` `sizeWidth` / `sizeHeight` for new work.

### Migration (1.2.0 → 1.3.0)

| Before | After |
|--------|-------|
| Composed `Dialog` + `DialogContent size="lg"` + header/footer | `CustomDialog` with `sizeWidth` / `sizeHeight` presets |
| Showcase `DialogSizeDemo` (sm–2xl) | `CustomDialogSizeDemo` (width × height matrix) |
| Footer actions in body | Move to `footer` prop |

---

## AlertDialog (strict confirmations)

Built on `@radix-ui/react-alert-dialog`. Use when delete/confirm must **not** dismiss on overlay click or Escape **without** manual `onInteractOutside` / `onEscapeKeyDown` guards.

| Export | Role |
|--------|------|
| `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent` | Root + panel |
| `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription` | Header |
| `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel` | Actions |

`AlertDialogAction variant="destructive"` for delete. No header X; overlay/Escape do not dismiss (Radix default).

**Prefer `CustomDialog`** for delete when sizing (`auto` + `max-w-md`) and footer standards matter; **use `AlertDialog`** when alert semantics are mandatory.

Dependency: `@radix-ui/react-alert-dialog`.

---

## File layout (package)

```text
ui-kit/package/src/components/
  CustomDialog.tsx        # new — primary API
  Dialog.tsx              # existing — used by CustomDialog + legacy
  AlertDialog.tsx         # new — strict confirms
```

Export `CustomDialog` + `DialogSizePreset` type from `index.ts`.

---

## Demo sections (Dialogs tab)

### 1. CustomDialog — width presets

One trigger per `sizeWidth` (`small`, `medium`, `large`, `xlarge`, `auto`) at default height; body shows current preset label.

### 2. CustomDialog — height + scroll

Demonstrate `sizeWidth="small"` + `sizeHeight="large"` with 20+ body lines — header/footer fixed, body scrolls (`scrollbar-themed`).

### 3. CustomDialog — common combinations

Live toggles or buttons for each row in the **Common size combinations** table (form, selection, wizard, delete).

### 4. CustomDialog — form dialog

`sizeWidth="small"` + `sizeHeight="large"`; `Form` + new 1.3.0 controls; Save/Cancel in `footer` only; Zod validation errors in body.

### 5. CustomDialog — delete confirmation

Mock list delete using `sizeWidth="auto"` + `maxWidth="max-w-md"`, `hideCloseButton`, guarded overlay/Escape; destructive footer button.

### 6. CustomDialog — nested

Outer `sizeWidth="large"` → inner `sizeWidth="auto"` + `maxWidth="max-w-sm"`. Outer sets **`nestedDismissGuard={innerOpen}`** so overlay/Escape dismiss the inner dialog first. Parent `onOpenChange` suppresses closing while inner is open (see `NestedDialogDemo` in `DialogsPage.tsx`).

### 7. AlertDialog — basic + delete (optional strict)

Side-by-side or separate demos: non-destructive confirm + destructive delete via `AlertDialog` (no overlay dismiss).

### 8. Theme sensitivity

Section id `dialog-theme`. Documents that ThemeToolbar accent changes affect glass borders, primary gradient Save, destructive Delete, and `ring-ring` focus when dialogs are reopened.

---

## Consumer adoption (beyond showcase)

| Service | Component | Usage |
|---------|-----------|-------|
| WebOnOne v2 | `CustomDialog` | Theme create/edit, CSS import (nested import uses `nestedDismissGuard`), media picker modal |
| WebOnOne v2 | `AlertDialog` | `ThemeDeleteDialog` — strict delete confirm |
| Media | `AlertDialog` | `MediaDeleteDialog` — strict delete confirm |
| Identity | `InputGroup`, `PasswordInput`, `PhoneInput` | Auth + profile forms |

---

## File layout (showcase)

Demos are inline in `DialogsPage.tsx` (section IDs: `custom-dialog-width`, `custom-dialog-scroll`, `custom-dialog-combinations`, `custom-dialog-form`, `custom-dialog-delete`, `custom-dialog-nested`, `alert-dialog`, `dialog-theme`).

---

## Acceptance criteria

1. `CustomDialog` exported from `@webonone/ui-kit` with full prop API above.
2. `sizeWidth` / `sizeHeight` presets match Tailwind classes in this spec.
3. Viewport cap `max-h-[calc(100vh-1rem)]` always applied.
4. Scroll rules: fixed presets scroll body only; `auto` height uses `max-h-[calc(100vh-10rem)]` cap.
5. Footer actions only in `footer` prop — showcase form demo has no Submit in body.
6. Delete demo uses `sizeWidth="auto"` + `maxWidth="max-w-md"` + destructive footer button.
7. `AlertDialog` available for strict non-dismissible confirms.
8. Low-level `Dialog` API unchanged for existing consumers; showcase migrates to `CustomDialog` demos.
9. All shell/border/button colors use theme tokens — no hardcoded accent hex.

---

## Verification

Manual:

1. Open each `sizeWidth` preset; verify percent widths at desktop viewport.
2. Open `small` + `large` height dialog; scroll body; header/footer stay fixed.
3. Delete `CustomDialog`: overlay click and Escape do not close (when guards set).
4. Nested dialogs: inner close keeps outer open.
5. `AlertDialog` delete: overlay/Escape do not dismiss without guards.
6. Toggle light/dark + accent palette; reopen — glass borders and buttons update.

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```
