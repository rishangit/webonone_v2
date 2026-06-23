# 06 — Theme Token Coverage

Every control and surface in 1.3.0 must respond to **System Theme** accent palettes and **light/dark mode** via semantic CSS variables — the same contract as [1.2.0 theme propagation](../1.2.0/05-theme-propagation.md).

No component may use hardcoded brand hex (except comments documenting intent).

---

## Variable layers

```text
User palette (color1–color5)
  → @webonone/theme applyThemeVariables()
    → --primary, --ring, --border, --input, --destructive, ...
      → Tailwind theme keys (primary, ring, border, ...)
        → Component utility classes
```

Showcase **ThemeToolbar** applies the same variable set as WebOnOne `ThemeProvider` for faithful preview.

---

## Token mapping by component

### Buttons

| Variant | Token classes |
|---------|---------------|
| `default` | `from-primary-gradient-from to-primary-gradient-to`, `text-primary-foreground` |
| `secondary` | `bg-secondary`, `text-secondary-foreground` |
| `outline` | `border-border`, hover `bg-accent` |
| `destructive` | `bg-destructive`, `text-destructive-foreground` |
| `ghost` | hover `bg-accent`, `text-accent-foreground` |
| `link` | `text-primary` |
| Focus | `ring-ring`, `ring-offset-background` |

### Input, Textarea, InputGroup

| State | Tokens |
|-------|--------|
| Background | `bg-input-background` |
| Border | `border-input` |
| Text | `text-foreground` |
| Placeholder | `placeholder:text-muted-foreground` |
| Focus | `focus-visible:ring-ring` |
| Disabled | `opacity-50`, `cursor-not-allowed` |
| Error | `border-destructive`, `ring-destructive/30`, `aria-invalid` |

InputGroup: ring on group when child input focused (`focus-within:ring-ring`, `ring-offset-0`). `invalid` prop → destructive border + ring.

### ColorInput

Same as InputGroup + inner `Input`; color swatch uses `border-input` on webkit swatch.

### PasswordInput / PhoneInput

Same as Input; toggle button uses `ghost` hover tokens.

### Select / MultiSelect

| Part | Tokens |
|------|--------|
| Trigger | Same height/border as Input |
| Content | `bg-popover`, `text-popover-foreground`, `border-border` |
| Item hover | `bg-accent`, `text-accent-foreground` |
| Selected item | `text-primary` or check in `text-primary` |

### DatePicker

| Part | Tokens |
|------|--------|
| Trigger input | Input tokens |
| Calendar popover | `bg-popover`, `border-border` |
| Selected day | `bg-primary`, `text-primary-foreground` |
| Today | `ring-ring` |
| Hover day | `bg-accent` |

### Checkbox / Switch / Radio

| Part | Tokens |
|------|--------|
| Checked | `bg-primary`, `border-primary` |
| Unchecked border | `border-input` or `border-border` |
| Switch track off | `bg-input` |
| Focus | `ring-ring` |
| Label | `text-foreground` |

### Slider

| Part | Tokens |
|------|--------|
| Track | `bg-secondary` |
| Range | `bg-primary` |
| Thumb | `border-primary`, `bg-background`, focus `ring-ring` |

### CustomDialog

| Part | Tokens |
|------|--------|
| Overlay | `bg-black/50`, backdrop blur, `z-[100]` |
| Shell | `glass-card` — `bg-[hsl(var(--glass-bg))]`, blur, `border-[hsl(var(--glass-border))]` |
| Header border | `border-[hsl(var(--glass-border))]` |
| Title / description | `text-foreground`, `text-muted-foreground` |
| Body scroll | `scrollbar-themed` |
| Inner body cards | `bg-[hsl(var(--glass-bg))]`, `border-[hsl(var(--glass-border))]` |
| Footer Cancel | `variant="outline"`, `border-[hsl(var(--glass-border))]`, hover `bg-accent` |
| Footer primary (Save) | `variant="default"` — primary gradient |
| Footer destructive (Delete) | `variant="destructive"` |

### Dialog (low-level / legacy)

| Part | Tokens |
|------|--------|
| Content | `bg-card`, `border-border` |
| Description | `text-muted-foreground` |
| Body scrollbar | `scrollbar-themed` → `--scrollbar-thumb` from color3 |
| Primary action | Button `default` gradient |

### AlertDialog

| Part | Tokens |
|------|--------|
| Content | Same panel tokens as `Dialog` (`bg-card`, `border-border`) |
| Title | `text-foreground` |
| Description | `text-muted-foreground` |
| `AlertDialogAction` (default) | Button `default` gradient |
| `AlertDialogAction` (destructive) | `bg-destructive`, `text-destructive-foreground` — **delete confirmation** |
| `AlertDialogCancel` | `Button variant="outline"` — `border-border`, hover `bg-accent` |
| Focus | `ring-ring` on action buttons |

Delete flows must use destructive `AlertDialogAction`, not a generic primary button.

### DropdownMenu

Same as Select popover + destructive item `text-destructive`.

### Callout

| Part | Tokens |
|------|--------|
| Default | Primary-tinted panel, `text-foreground` title |
| `variant="muted"` | `bg-muted`, lower emphasis |

### ItemList

| Part | Tokens |
|------|--------|
| Row | `glass-card` surface, hover themed shadow |
| Active row | `itemListRowActiveClassName` accent border/bg |
| Menu trigger | `MoreVertical` icon, `text-muted-foreground` |

### Card, Alert, Avatar, Spinner

| Component | Key tokens |
|-----------|------------|
| Card | `bg-card`, `border-border` |
| Alert destructive | `border-destructive/50`, `text-destructive` |
| Avatar border | `border-primary` (theme accent) |
| Avatar fallback | `bg-muted`, `text-muted-foreground` |
| Spinner | `text-primary` or `border-primary` (match existing) |

### AppShell / AppHeader / Nav

| Element | Tokens |
|---------|--------|
| Sidebar | `bg-card`, `border-border` |
| Active nav item | `bg-accent`, `text-accent-foreground` or `text-primary` |
| Header | `bg-card/80`, `border-border` |

---

## Dark mode

Neutrals switch via `.dark` in `globals.css` (`--background`, `--foreground`, `--card`, `--border`, `--input-background`).

Accent slots (`--color-1` … `--color-5`) are **re-mapped** by `@webonone/theme` for dark (color4/color5 swap per 1.2.0 model).

Showcase must prove:

1. Light + Platform Default palette
2. Dark + same palette
3. Alternate palette (e.g. green/purple seed) — optional second preset in toolbar

---

## globals.css additions (if needed)

When new components need tokens not yet in Tailwind config:

| Token | Used by |
|-------|---------|
| `--popover` / `--popover-foreground` | Select, DatePicker, DropdownMenu (already in 1.2.0) |
| `--input-background` | All inputs (already present) |

Extend `tailwind.config.ts` `theme.extend.colors` to map any new CSS variables.

---

## Showcase verification checklist

For each Controls tab section, with ThemeToolbar:

- [ ] Toggle dark mode — borders and backgrounds flip; text remains readable
- [ ] Change color1/color2 — primary button gradient updates
- [ ] Change color3 — focus ring and scrollbar thumb update
- [ ] Change color4/destructive mapping — destructive button and error borders update

Automated tests: **not required** in 1.3.0; manual showcase checklist suffices.

---

## Acceptance criteria

1. Token table above implemented for every **new** export in [03-form-controls.md](./03-form-controls.md).
2. Grep `ui-kit/package/src` for `#2563` / `#3b82` — only allowed in `globals.css` fallback `:root`, not in components.
3. ThemeToolbar changes reflect without full page reload on all showcase tabs.
