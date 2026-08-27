---
name: date-display
description: >-
  Formats user-visible dates as Oct 10, 2026 (short month, numeric day, comma,
  year) via shared Intl options and locale-aware helpers. Use when rendering
  dates in lists, details pages, invoices, history, media metadata, calendars,
  or any frontend copy that shows a calendar date to the user.
---

# Date display

Standard workflow for **showing dates in the UI**. Storage and APIs stay ISO; only rendered strings use this shape.

Authoritative rule: [date-display-format.mdc](../../rules/date-display-format.mdc). Locale tags: [frontend-i18n.mdc](../../rules/frontend-i18n.mdc).

## Target shape

**`Oct 10, 2026`** — abbreviated month, day without leading zero, comma, four-digit year.

## When to apply

- List subtitles (`Created Oct 10, 2026`, due dates, session dates)
- Details / profile read-only fields
- Invoice, payment, email history, SMS queue timestamps (date portion)
- Media file modified dates
- Calendar occurrence labels (date-only rows)
- Replacing ad-hoc `toLocaleDateString()` or raw ISO in JSX

## Standard options

Define once per service (or import from a shared util):

```typescript
import { INTL_LOCALE_TAGS, normalizeLocale, type AppLocale } from '@webonone/i18n'

export const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

export const DISPLAY_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DISPLAY_DATE_OPTIONS,
  hour: 'numeric',
  minute: '2-digit',
}
```

## Workflow

1. **Parse** — `new Date(iso)` or `Date` from `DatePicker`; guard `Number.isNaN(date.getTime())` → `'—'` or empty.
2. **Locale** — pass active language (`i18n.language`) into the helper so `si` uses `si-LK`.
3. **Format** — `date.toLocaleDateString(intlTag, DISPLAY_DATE_OPTIONS)` via a shared helper — not inline in the component.
4. **Ranges** — `` `${formatDate(start)} – ${formatDate(end)}` `` (en dash between two formatted dates).
5. **API boundary** — send/receive ISO strings; format only at render time.

### WebOnOne v2 pattern

```typescript
import { useTranslation } from 'react-i18next'
import {
  formatLocaleDate,
  DISPLAY_DATE_OPTIONS,
} from '@/shared/utils/formatLocaleDate'

const { i18n } = useTranslation()
// …
{formatLocaleDate(item.createdAt, DISPLAY_DATE_OPTIONS, i18n.language)}
```

Colocate `DISPLAY_DATE_OPTIONS` in the same module as `formatLocaleDate` (or a sibling `displayDateOptions.ts`). Copy `webonone-v2/frontend/src/shared/utils/formatLocaleDate.ts` when scaffolding a new service.

### YMD calendar strings (`2026-10-10`)

Parse as local calendar date before formatting:

```typescript
const [y, m, d] = ymd.split('-').map(Number)
const date = new Date(y, m - 1, d)
return formatLocaleDate(date, DISPLAY_DATE_OPTIONS, language)
```

## Checklist

- [ ] User-visible date uses `DISPLAY_DATE_OPTIONS`
- [ ] Locale from `i18n.language` / `getIntlLocaleTag` — not browser default alone
- [ ] Invalid/missing values show `'—'` or empty — not `Invalid Date`
- [ ] No raw ISO or SQL date strings in JSX
- [ ] Datetime rows use `DISPLAY_DATETIME_OPTIONS` (date portion matches date-only shape)
- [ ] List subtitles and detail fields follow [item-list](../item-list/SKILL.md) / [details-page-cards](../details-page-cards/SKILL.md)

## Forbidden

- Per-component `toLocaleDateString()` without shared options
- Different shapes in the same app (e.g. `10/10/2026` next to `Oct 10, 2026`)
- Formatting at rest in the store or API layer

## Verification

```bash
npm run type-check -w @webonone/<service>-frontend
```

Manual: English shows `Oct 10, 2026`; Sinhala localizes the month name while keeping the same structural pattern.
