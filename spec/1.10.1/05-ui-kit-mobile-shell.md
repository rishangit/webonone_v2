# 05 — UI Kit mobile shell (1.10.1 delta)

Mobile layout polish for product shells (`AppShell`, `PageShell`) and sidebar navigation.

Subtask: **mobile view improvement** (`86ey5f2xt`).

---

## Requirements

### Body content padding

On viewports below `sm`, main content uses **`px-2`** horizontal padding (8px) instead of the desktop `px-6` (24px). This gives list and form content more usable width on narrow screens.

| Layout | Mobile | Desktop (`sm+`) |
|--------|--------|-----------------|
| `AppShell` main | `px-2 py-4` | `px-6 py-6` |
| `PageShell` main | `px-2` | `px-4` |

### Header alignment

`AppHeader` inner row uses the **same horizontal padding** as `AppShell` main (`shellContentPaddingX`: `px-2 sm:px-6`) so logo, menu button, and page titles align with body content.

### Navigation touch targets

Sidebar `NavItem` and `NavGroup` trigger rows use **`py-3`** on mobile and **`py-2`** from `md` up so finger taps hit a taller target in the mobile drawer.

---

## Implementation

| File | Change |
|------|--------|
| `ui-kit/package/src/layouts/shellContentPadding.ts` | Shared `shellContentPaddingX` export |
| `ui-kit/package/src/layouts/AppShell.tsx` | Mobile body padding |
| `ui-kit/package/src/components/AppHeader.tsx` | Match header padding |
| `ui-kit/package/src/layouts/PageShell.tsx` | Mobile body padding |
| `ui-kit/package/src/components/nav/NavItem.tsx` | Mobile `py-3` |
| `ui-kit/package/src/components/nav/NavGroup.tsx` | Mobile `py-3` |

---

## Verification

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```

Manual: open Email or WebOnOne on a phone-width viewport — header title and list rows share the same left edge; sidebar items are easier to tap.
