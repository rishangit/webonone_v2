# 04 — UI Kit OTP input control (1.9.1)

Shared **OTP entry** control for multi-digit verification codes. Default **4 boxes**; digit count is configurable via props. Showcase demo on the Controls tab; consumers use it anywhere OTP is collected (Identity verify-reset step first).

## Requirements

| Requirement | Detail |
|-------------|--------|
| Separate boxes | One input cell per digit (not a single long text field) |
| Default length | **4** digits |
| Configurable length | `length` prop (e.g. 6 for future flows) |
| Numeric only | Reject non-digits; `inputMode="numeric"` |
| Auto-advance | Focus next cell on digit entry |
| Backspace | Clear current cell; move to previous when empty |
| Paste | Paste full code distributes across cells |
| Accessibility | `aria-label` per cell or group label; `autoComplete="one-time-code"` on first cell |
| Disabled / invalid | `disabled` prop; `aria-invalid` when form reports error |
| Value API | Controlled: `value: string`, `onChange: (value: string) => void` — concatenated digits |

## Component API

```typescript
export interface OtpInputProps {
  length?: number          // default 4
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
  autoFocus?: boolean
  'aria-invalid'?: boolean
}
```

Export from `@webonone/ui-kit` as `OtpInput` / `OtpInputProps`.

## Files

| Path | Change |
|------|--------|
| `ui-kit/package/src/components/OtpInput.tsx` | **New** — digit boxes component |
| `ui-kit/package/src/index.ts` | Export `OtpInput`, `OtpInputProps` |
| `ui-kit/showcase/src/pages/ControlsPage.tsx` | Demo section **OTP input** (4-digit default + 6-digit example) |
| `identity/frontend/src/features/auth/pages/VerifyResetOtpPage.tsx` | Replace single `Input` with `OtpInput` |

## Styling

- Match `Input` standalone styling: `h-10`, rounded border, focus ring per `Input.tsx` tokens.
- Cells in a horizontal flex row with small gap (`gap-2`).
- Each cell: fixed width (~2.5rem), centered digit, `text-center`, `text-lg` or `text-base`.

## Acceptance

- [ ] `OtpInput` exported from UI Kit
- [ ] Showcase Controls tab demonstrates 4-digit (default) and configurable length
- [ ] Identity `VerifyResetOtpPage` uses `OtpInput` with `length={4}`
- [ ] Paste, backspace, and auto-advance work in browser
- [ ] `npm run type-check -w ui-kit-root` and `identity-root` pass

## ClickUp

Subtask **86ey3rq8b** — need to have the control for OTP.
