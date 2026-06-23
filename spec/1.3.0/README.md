# WebOnOne Platform — Specification (1.3.0)

Extends [1.2.0](../1.2.0/README.md) with a **comprehensive UI Kit control library** and a **tabbed showcase** that documents every primitive with live, theme-aware demos.

Implementation branch: **`feature/ui-kit-1.3.0-showcase`**

## What changed from 1.2.0

| Area | 1.2.0 | 1.3.0 |
|------|-------|-------|
| Showcase layout | Single long scroll page (`ShowcaseHome`) | **Four top-level tabs**: Controls, Components, Dialogs, Icons |
| Form controls | `Input` (plain), `Button`, `Form`/`FormField` | Full **control set**: `InputGroup` + `inGroup`, password, email, phone (+ E.164 helpers), **ColorInput**, date, select, multi-select, checkbox, switch, radio, textarea, slider |
| Components coverage | Partial (Alert, Spinner, Toast, Avatar, shell, Card) | **Complete composite section**: forms, feedback, **Callout**, loadings, toast, 3-dot menu, **ItemList**, avatars, App header, App shell, theming, layout, cards |
| Dialogs | Size demos + nested `Dialog` | **`CustomDialog`** (width/height presets, delete, forms) + **`AlertDialog`**; dedicated Dialogs tab |
| Theme coverage | Primary gradient, ring, border on Button/Input | **Every new control** maps to semantic tokens; showcase proves accent changes at runtime |

## Projects affected

| Project | Role in 1.3.0 |
|---------|----------------|
| **UI Kit** (`ui-kit/package`) | New Radix-based primitives, `InputGroup` pattern, showcase tab shell |
| **UI Kit showcase** (`ui-kit/showcase`) | Tab navigation, per-category demo pages, global theme toolbar |
| **Identity** | Auth + profile forms — icon inputs, `PasswordInput`, `PhoneInput` with E.164 submit |
| **WebOnOne v2** | `CustomDialog` (theme editor, media picker), `ColorInput`, `AlertDialog` delete confirms |
| **Media** | `ItemList` in folder tree / grid empty state, `AlertDialog` delete confirm |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |
| [02-showcase-tabbed-navigation.md](./02-showcase-tabbed-navigation.md) | Tab shell, routing, demo page structure |
| [03-form-controls.md](./03-form-controls.md) | Controls tab — every input primitive |
| [04-composite-components.md](./04-composite-components.md) | Components tab — layouts, feedback, menus |
| [05-dialogs.md](./05-dialogs.md) | `CustomDialog` sizing/shell, `AlertDialog`, Dialogs tab demos |
| [06-theme-token-coverage.md](./06-theme-token-coverage.md) | Token mapping for all new controls |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [08-icons.md](./08-icons.md) | Lucide icon catalog, Icons showcase tab |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.0.0/05-ui-kit-project.md](../1.0.0/05-ui-kit-project.md) | UI Kit package + showcase baseline |
| [../1.2.0/06-ui-kit-extensions.md](../1.2.0/06-ui-kit-extensions.md) | AppShell, Dialog sizes, gradient Button |
| [../1.2.0/04-system-theme.md](../1.2.0/04-system-theme.md) | Accent palette + light/dark model |
| [../1.2.0/05-theme-propagation.md](../1.2.0/05-theme-propagation.md) | Runtime CSS variables |

## Rules reference

| Topic | Rule |
|-------|------|
| UI Kit scope | `ui-kit-project.mdc` |
| Tailwind + tokens | `tailwind-css.mdc` |
| Code cleanliness | `code-cleanliness.mdc` |

## Local dev

```bash
npm run dev:ui-kit    # showcase at http://localhost:3002
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```
