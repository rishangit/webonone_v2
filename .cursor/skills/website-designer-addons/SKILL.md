---
name: website-designer-addons
description: >-
  Add or change Design website designer add-ons (registry, defaults, Zod schema,
  settings tabs, data binding, public render). Use when tasks touch
  design/frontend/src/features/website/addons/, websiteDocument.schema, or
  WebpageEditor / content slider / image / button / text / menu addons.
---

# Website designer addons

Workflow for **Design → Website** document add-ons. Data binding contract: [website-designer-data-binding.mdc](../../rules/website-designer-data-binding.mdc). Design service overview: [design-agent skill](../design-agent/SKILL.md).

## Layout

```text
design/frontend/src/features/website/addons/
  types.ts          # AddonModule, render/props props
  registry.ts       # getAddonModules / getAddonModuleByType
  <type>/           # one folder per addon
    *Addon.tsx      # module export (createDefault, Render, PropsFields)
backend/src/schemas/websiteDocument.schema.ts  # Zod mirror of props
```

## AddonModule contract

Every addon exports an `AddonModule` registered in `registry.ts`:

| Field | Role |
|-------|------|
| `type` | Discriminant on `WebsiteAddon` |
| `labelKey` / `descriptionKey` | i18n under `website` ns |
| `createDefaultAddon` | Toolbox insert defaults |
| `RenderComponent` | Canvas + public site |
| `PropsFields` | **Basic** tab only (structure/chrome-adjacent, not dataset) |
| `DataBindingFields?` | **Dataset owners only** (e.g. content slider) — Data Binding tab |

Settings dialog ([`AddonSettingsDialog.tsx`](../../../design/frontend/src/features/website/components/AddonSettingsDialog.tsx)):

1. Basic → `PropsFields`
2. Settings → shared element chrome
3. Data Binding → `DataBindingFields` if present, else field-mapper [`AddonDataBindingFields`](../../../design/frontend/src/features/website/components/AddonDataBindingFields.tsx)

## Checklist (new or changed addon)

1. Add/update types in `features/website/types.ts` and Zod in `websiteDocument.schema.ts`.
2. Implement module under `addons/<type>/`; register in `registry.ts`.
3. Put **dataset / row-source** UI on Data Binding (`DataBindingFields` or parent block) — never on Basic.
4. Put **prop → field maps** in `ADDON_BINDABLE_PROP_KEYS` + `AddonDataBindingFields` for field-mapper addons.
5. Ensure `collectBoundDatasetIds` / publish expand path still collects any owned `datasetId`.
6. Add `en` + `si` keys under `design/frontend/src/locales/*/website.json`.
7. Type-check: `npm run type-check -w design-root`.

## Content slider (dataset owner + child host)

- Basic: navigation, auto-slide only (no preset picker).
- **Plus** on the selected slider (and on slide-template blocks) opens the same Add dialog as content blocks → addons / presets / nested blocks into `props.slideTemplate`.
- **First preset into an empty slider** becomes the slide root (no empty wrapper Block). Further presets/blocks append as children.
- Loading a document runs `normalizeSliderSlideTemplates` to promote legacy `Slider → blank Block → single child` trees.
- Data Binding: `dataSource` / `datasetId` / `itemGroup` / `manualSlides` via `SliderDataBindingFields`.
- **Item group** selects which child under the slide shell (by `groupName`) is the repeating card per data row — same idea as content-block `itemGroup`.
- Nested template addons map fields on **their** Data Binding tabs; designer passes `datasetIdOverride` from the slider. Field dropdowns show **array** / **object** / **string** type chips.
- Item-group content blocks under a dataset-bound slider **inherit** the parent dataset — Data Binding shows an inherited banner plus a **parent property** picker (`itemsPath`) so nested presets/sliders can take e.g. `galleryImages` from each product row.
- Nested content sliders may use `dataSource: 'parent'` + `itemsPath` (allowed inside slide templates).
- Mutations: `addAddonToSliderTemplate`, `addBlocksFromPresetToSliderTemplate`, `addBlockToSliderTemplate` in `document/mutate.ts`.

### Product card + gallery (supported pattern)

| Layer | Use |
|-------|-----|
| Page | Content **slider** bound to a **products** dataset |
| Slide template | Product-card **preset** (texts + media) |
| Product gallery | Nested content **slider** with `dataSource: 'parent'` + `itemsPath` (e.g. `galleryImages`), slide children = image (or image preset) |

Use nested parent-path sliders for multi-image galleries inside a product slide — not a separate image-carousel addon.

## Forbidden

- Dataset picker on the Basic tab for new owners
- Slide-preset Select on Basic (use Plus → Presets instead)
- Empty wrapper Block between Slider and the product/preset root (use replace-on-blank insert)
- Field-mapping the slider itself instead of nested template addons
- Skipping backend Zod when props change
- Importing another service’s source for Media — use media-dialog / picker embed

## Verification

```bash
npm run type-check -w design-root
```
