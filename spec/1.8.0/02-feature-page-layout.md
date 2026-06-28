# 02 — Feature Page Layout

Shared layout primitives for route-level pages inside **`AppShell`** main content.

Related: [../1.2.0/03-app-shell-navigation.md](../1.2.0/03-app-shell-navigation.md).

---

## Problem (current state)

WebOnOne v2 feature pages duplicate layout markup with inconsistent tokens:

| Page | Width | Title | Header → body spacing |
|------|-------|-------|------------------------|
| `BasicSettingsPage` | `mx-auto max-w-2xl` | `text-2xl font-semibold` | `space-y-6` (wrapper) |
| `CompaniesPage` | `mx-auto max-w-4xl` | `text-2xl font-semibold` | `space-y-6` |
| `SystemThemePage` | none (full width) | `text-3xl font-bold` | `space-y-8` |
| `HomePage` | none | `text-3xl font-bold` | ad hoc `mt-*` |

Subtask **spaces and gaps** requires one enforced pattern.

---

## Components (UI Kit)

### `PageHeader`

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `title` | `string` | required | Page `<h1>` text |
| `description` | `string` | optional | Muted subtitle under title |
| `actions` | `ReactNode` | optional | Trailing controls (buttons) aligned end on `sm+` |
| `className` | `string` | optional | Extra classes on root |

**Markup contract:**

```tsx
<header className="space-y-1">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
</header>
```

### `FeaturePage`

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `title` | `string` | optional* | Passed to `PageHeader` when `header` omitted |
| `description` | `string` | optional | Passed to `PageHeader` |
| `actions` | `ReactNode` | optional | Passed to `PageHeader` |
| `header` | `ReactNode` | optional | Custom header (e.g. pre-built `PageHeader`) |
| `children` | `ReactNode` | required | Page body below header |
| `className` | `string` | optional | Extra classes on outer wrapper |

\*When `header` is provided, `title` / `description` / `actions` are ignored.

**Outer wrapper contract:**

```tsx
<div className={cn('flex w-full flex-col gap-6', className)}>
  {header ?? <PageHeader title={title!} description={description} actions={actions} />}
  <div className="min-w-0">{children}</div>
</div>
```

Feature pages use the **full width** of the `AppShell` main content area. Do not add `max-w-*` or `mx-auto` on the page wrapper — narrow inner sections (forms, cards) may constrain themselves inside `children`.

---

## Consumer usage (WebOnOne v2)

**Standard page:**

```tsx
export function CompaniesPage() {
  return (
    <FeaturePage
      title="Companies"
      description="Review registered companies and update approval status."
    >
      {/* alerts, lists, forms */}
    </FeaturePage>
  )
}
```

**Page with header actions:**

```tsx
<FeaturePage
  title="System Theme"
  description="Create accent palettes and switch light or dark mode."
  actions={<Button onClick={openCreate}>Create theme</Button>}
>
  {/* sections */}
</FeaturePage>
```

**Narrow form page** — keep `FeaturePage` full width; apply `max-w-*` on inner form/card containers if needed (e.g. Basic Settings).

---

## Pages to refactor (WebOnOne v2)

| Page | Path | Notes |
|------|------|-------|
| `HomePage` | `features/home/pages/HomePage.tsx` | Add title + description via `FeaturePage` |
| `BasicSettingsPage` | `features/settings/basic/pages/BasicSettingsPage.tsx` | default full width; narrow form inside body if needed |
| `CompaniesPage` | `features/settings/basic/pages/CompaniesPage.tsx` | default full width |
| `SystemThemePage` | `features/settings/system-theme/pages/SystemThemePage.tsx` | Move "Create theme" to `actions`; normalize title size |

**Excluded:** `LoginPage`, `AuthCallbackPage` (auth redirect / callback flows).

---

## Showcase

Add a **Feature page layout** section demonstrating:

- Default layout with title + description
- Header with `actions` slot

Location: `ui-kit/showcase/src/pages/ComponentsPage.tsx` or new `LayoutsPage.tsx` linked from showcase nav.

---

## ClickUp subtask mapping

Subtask **spaces and gaps** (86ey2ymt2):

1. Header with clearly defined title section → **`PageHeader`**
2. Full width within shell main content → **`FeaturePage`** `w-full`
3. Consistent title-to-content spacing → **`gap-6`**
4. Cursor rule enforcement → [03-cursor-rule.md](./03-cursor-rule.md)
