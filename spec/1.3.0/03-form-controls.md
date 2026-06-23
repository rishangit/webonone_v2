# 03 — Form Controls (Controls tab)

New and extended primitives for `@webonone/ui-kit`. All controls must support **disabled**, **focus-visible ring**, and **theme tokens** (see [06-theme-token-coverage.md](./06-theme-token-coverage.md)).

Baseline: existing `Button`, `Input`, `Label`, `Form`, `FormField`.

---

## Shared patterns

### InputGroup

Composable wrapper for inputs with leading/trailing icons or affixes.

| Export | Purpose |
|--------|---------|
| `InputGroup` | Flex container; forwards focus ring to child input |
| `InputGroupText` | Non-interactive prefix/suffix (e.g. `+1`, `@`) |
| `InputGroupIcon` | Lucide icon slot; `position: 'leading' \| 'trailing'` |

```tsx
<InputGroup>
  <InputGroupIcon icon={Mail} />
  <Input type="email" placeholder="you@example.com" />
</InputGroup>
```

### Input `inGroup` and focus-ring fix

When an `Input` sits inside `InputGroup`, pass **`inGroup`** so the inner field has no standalone border or focus ring — the group shell owns both:

```tsx
<InputGroup>
  <InputGroupIcon icon={Mail} />
  <Input type="email" inGroup placeholder="you@example.com" />
</InputGroup>
```

Exported class-name constants (for custom composites):

| Export | Purpose |
|--------|---------|
| `inputFocusRingClassName` | Standalone input — `ring-offset-0` flush ring |
| `inputGroupFocusRingClassName` | Group shell `focus-within` ring |
| `inputInGroupFieldClassName` | Inner field — borderless, no ring |

`InputGroup` accepts **`invalid`** (or `aria-invalid`) to apply destructive border + ring on the group.

Focus: clicking icon focuses input; ring wraps full group (`ring-ring`, no offset gap).

### Icon API conventions

- **Composition pattern:** `InputGroup` + `InputGroupIcon` for text/email and custom grouped inputs.
- **Prop pattern:** controls with integrated trigger shells use dedicated props (for example `SelectTrigger.leadingIcon`, `PasswordInput.withIcon`, `PhoneInput.withIcon`, `MultiSelect.leadingIcon`).

### Form integration

All controls work inside existing `FormField`:

```tsx
<FormField label="Email" htmlFor="email" required error={errors.email}>
  <InputGroup>...</InputGroup>
</FormField>
```

Error state: `aria-invalid`, `border-destructive`, `ring-destructive/30` on the control or group.

---

## Buttons

### Buttons (existing)

Keep variants: `default`, `secondary`, `outline`, `destructive`, `ghost`, `link`, sizes `default` | `sm` | `lg` | `icon`.

Showcase: all variants × disabled row.

### Buttons with icons (extend)

| Pattern | API |
|---------|-----|
| Leading icon | `Button` children: `<Icon /> Label` or new prop `leftIcon?: LucideIcon` |
| Trailing icon | `rightIcon?: LucideIcon` |
| Icon only | `size="icon"` + `aria-label` |

Prefer **composition** (icon as child) over many props; optional `ButtonIcon` helper for consistent `size-4` spacing.

Showcase: Save (leading), Next (trailing), icon-only Refresh with `aria-label`.

---

## Text inputs

Base: extend `Input` — no breaking API change.

| Section | Implementation |
|---------|----------------|
| Input text | `<Input />` — placeholder, disabled |
| Input text (with icon) | `InputGroup` + search/user icon |
| Password | `<Input type="password" />` + optional `PasswordInput` with visibility toggle |
| Password (with icon) | `PasswordInput` + lock icon in group |
| Email text | `<Input type="email" />` + `autoComplete="email"` |
| Email text (with icon) | `InputGroup` + mail icon |
| Phone input | `PhoneInput` with `showCountrySelector={false}` — plain `type="tel"` |
| Phone input (with country) | `PhoneInput` — searchable country/dial-code selector; defaults to browser locale region |
| Phone input (with icon) | `PhoneInput` + phone icon + country selector |

### PhoneInput (new export)

```tsx
interface PhoneInputProps extends Omit<InputProps, 'type'> {
  withIcon?: boolean
  showCountrySelector?: boolean  // default true
  defaultCountry?: string        // ISO 3166-1 alpha-2; overrides browser locale when set
  country?: string               // controlled ISO 3166-1 alpha-2
  onCountryChange?: (country: PhoneCountry) => void
}
```

**Country list:** static `PHONE_COUNTRIES` (~250 rows) in `data/phoneCountries.ts` — ISO 3166-1 alpha-2 + E.164 dial codes (ITU-T snapshot from `country-telephone-data@0.6.3`). No runtime npm dependency for consumers. Shared dial codes (US/CA +1) are separate rows keyed by `iso2`.

**Browser default:** `getBrowserDefaultCountryIso2()` walks `navigator.languages` / `Intl.Locale` region and validates against `PHONE_COUNTRIES`. Locale-based, not IP geolocation.

**Selector UI:** internal `PhoneCountrySelect` — Popover + search filter + scrollable list inside `InputGroup` (flag emoji + dial code trigger).

**Helpers (exported):** `getPhoneCountryByIso2`, `getFlagEmoji`, `formatPhoneE164(iso2, nationalNumber)`, `parsePhoneE164(e164, { fallbackIso2?, preferIso2? })` — concat/split only, no libphonenumber validation in v1.3.

National number uses standard input `value` / `onChange` / `ref`. `onCountryChange` is optional and intended for forms that explicitly model phone-country metadata.

**Identity profile (Phase 7):** uses full `PhoneInput` with country selector; submit stores **E.164** via `formatPhoneE164`; load uses `parsePhoneE164` with `preferIso2` from address `country`. Address `country` remains a separate ISO-2 address field.

### PasswordInput (new export)

```tsx
interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showToggle?: boolean  // default true
  withIcon?: boolean    // default false
}
```

Toggle button: ghost icon button trailing inside group; `aria-label` "Show password" / "Hide password".

---

## ColorInput (new export)

Hex color field: native `<input type="color">` swatch + text `Input` inside `InputGroup`.

```tsx
interface ColorInputProps extends Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  value: string
  onChange?: (value: string) => void
}
```

Uses `normalizeHexColor` / `isValidHexColor` from `@webonone/ui-kit`. Showcase sections: `color-picker`, `color-picker-disabled`. Used in WebOnOne system-theme `ThemeForm`.

---

## Date picker

| Export | Description |
|--------|-------------|
| `DatePicker` | Trigger + popover calendar OR styled native fallback |

Phase 1: **Popover + calendar grid** built from:

- `@radix-ui/react-popover`
- Internal `Calendar` subcomponent (month nav, day grid)
- Tokens: selected day `bg-primary text-primary-foreground`, today ring `ring-ring`

With icon: calendar icon in `InputGroup` opens popover on click.

Props: `value?: Date`, `onChange?(date: Date | undefined)`, `disabled`, `placeholder`.

Showcase: single date, disabled, with icon trigger.

---

## Select

| Export | Description |
|--------|-------------|
| `Select` | Root |
| `SelectTrigger` | Button-like trigger matching Input height |
| `SelectValue` | Placeholder / selected label |
| `SelectContent` | Popover list (`bg-popover`, `border-border`) |
| `SelectItem` | Row with check indicator |
| `SelectGroup`, `SelectLabel`, `SelectSeparator` | Optional grouping |

Built on `@radix-ui/react-select`.

With icon: use `SelectTrigger leadingIcon={User}` (full-width trigger; dropdown width matches trigger).

Showcase: country select, disabled, with icon.

---

## Multi-select

| Export | Description |
|--------|-------------|
| `MultiSelect` | Controlled `value: string[]`, `onValueChange`, `options: { value, label }[]` |

Implementation: single composite control with internal trigger/popover list.

With icon: filter/tags icon leading.

Showcase: pick 2–3 tags, disabled state.

---

## Checkbox

| Export | Description |
|--------|-------------|
| `Checkbox` | Radix checkbox |

Checked: `bg-primary border-primary`; focus `ring-ring`.

Showcase: single, group with labels, disabled, indeterminate (if supported).

---

## Switch

| Export | Description |
|--------|-------------|
| `Switch` | Radix switch |

Checked track: `bg-primary`; unchecked: `bg-input` or `bg-muted`.

Showcase: with label, disabled, controlled demo.

---

## Radio option

| Export | Description |
|--------|-------------|
| `RadioGroup` | Root |
| `RadioGroupItem` | Circle indicator |
| `Label` | Associated label (existing) |

Selected: `border-primary text-primary` indicator fill.

Showcase: vertical list, horizontal inline, disabled group.

---

## Text area

| Export | Description |
|--------|-------------|
| `Textarea` | `<textarea>` matching Input tokens |

Same border, focus ring, disabled opacity as `Input`.

Showcase: default rows, disabled, character hint (showcase-only text).

---

## Slider

| Export | Description |
|--------|-------------|
| `Slider` | Radix slider root |

Range fill: `bg-primary`; thumb: `border-primary bg-background ring-ring`.

Showcase: single value, range (two thumbs) optional, disabled.

---

## Dependencies to add

```json
{
  "@radix-ui/react-checkbox": "^1.x",
  "@radix-ui/react-switch": "^1.x",
  "@radix-ui/react-radio-group": "^1.x",
  "@radix-ui/react-select": "^2.x",
  "@radix-ui/react-popover": "^1.x",
  "@radix-ui/react-slider": "^1.x",
  "@radix-ui/react-tabs": "^1.x"
}
```

`@radix-ui/react-tabs` — showcase tab shell only (export `Tabs` from UI Kit only if product apps need it; default: showcase-local).

---

## File layout (package)

```text
ui-kit/package/src/components/
  Input.tsx                 # + inGroup prop; exported focus class names
  InputGroup.tsx            # new — invalid prop
  PasswordInput.tsx         # new
  PhoneInput.tsx            # new
  PhoneCountrySelect.tsx    # internal — searchable country selector
  ColorInput.tsx            # new
  Textarea.tsx              # new
  ...
ui-kit/package/src/data/
  phoneCountries.ts         # static ISO + E.164 list
ui-kit/package/src/lib/
  getBrowserDefaultCountryIso2.ts
```

Export all public APIs from `index.ts`.

---

## Acceptance criteria

1. Every row in Controls tab inventory renders live demos.
2. Icon variants use the documented icon patterns consistently (`InputGroup` composition or control-level icon props) with `h-10` alignment.
3. Select/MultiSelect/DatePicker popovers use `bg-popover`, `border-border`, `text-popover-foreground`.
4. Password toggle is keyboard accessible.
5. All new components pass `type-check` and `build`.
