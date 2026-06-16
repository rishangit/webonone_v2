# 05 — UI Kit Project

Standalone project: **component library** (`@webonone/ui-kit`) plus a **showcase app** that runs independently and displays every UI element.

## Folder layout

```text
ui-kit/
  package/                  # @webonone/ui-kit — npm package
    src/
      components/
      layouts/
      hooks/
      styles/
      index.ts
    tailwind.config.ts
    package.json
  showcase/                 # Runnable demo — port 3002
    src/
      pages/
        ShowcaseHome.tsx
        components/         # one page/section per component group
      app/
      main.tsx
    package.json
  package.json              # workspace root: dev runs showcase
```

## Responsibilities

- Export all shared UI primitives and layouts.
- Provide Tailwind preset and global styles.
- Showcase app documents and previews every export.

## Consumers

| Project | Usage |
|---------|-------|
| `identity/frontend` | Login, register, embed login forms |
| `webonone-v2/frontend` | PageShell, layout — not login forms |
| `ui-kit/showcase` | Demo all components |

**Rule**: Identity and WebOnOne v2 **must** import base UI from `@webonone/ui-kit`. No duplicate Button, Input, Card, etc.

## Showcase app (standalone)

Runs on its own (e.g. `http://localhost:3002`) without Identity or WebOnOne.

### Requirements

- List every exported component with live examples.
- Group by category: inputs, buttons, feedback, overlays, layout.
- Show variants (default, destructive, outline, disabled, etc.).
- Use same theme tokens as consumers.

### Example sections

| Section | Components |
|---------|------------|
| Actions | Button |
| Forms | Input, Label, Form, Checkbox |
| Feedback | Alert, Spinner, Toast |
| Overlays | Dialog |
| Layout | Card, AuthLayout, PageShell |

## Package exports (1.0.0 minimum)

| Export | Type |
|--------|------|
| `Button`, `Input`, `Label`, `Card`, `Dialog`, `Form`, `Alert`, `Spinner` | Components |
| `AuthLayout`, `PageShell` | Layouts |
| `useToast` | Hook |
| `@webonone/ui-kit/styles` | Global CSS |
| `@webonone/ui-kit/tailwind` | Tailwind preset |

Generic components only — no Identity or WebOnOne domain components.

## Consumer setup

**1. Dependency**

```json
{ "dependencies": { "@webonone/ui-kit": "workspace:*" } }
```

**2. Tailwind** — preset + content paths including `ui-kit/package/src`.

**3. Styles** — `import '@webonone/ui-kit/styles'` in `main.tsx`.

## Styling

Follow `tailwind-css.mdc`: utilities only, semantic tokens, shadcn/ui primitives, mobile-first.

## Boundaries

| In UI Kit | Not in UI Kit |
|-----------|---------------|
| Button, Input, Dialog | LoginForm API wiring |
| AuthLayout shell | IdentityLoginFrame, iframe logic |
| PageShell | HomePage, domain pages |

## Standalone run

```bash
cd ui-kit
npm run dev
```

Opens showcase at `http://localhost:3002` with all components visible.

## Acceptance criteria

1. Showcase runs independently and displays every exported component.
2. Package builds (`npm run build` in `package/`).
3. Identity and WebOnOne frontends consume `@webonone/ui-kit` with no duplicated primitives.
