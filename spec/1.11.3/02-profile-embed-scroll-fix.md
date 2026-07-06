# 02 — Profile embed scroll fix (1.11.3)

## Symptom

WebOnOne core → left nav **Profile** → Identity profile loads in iframe. Vertical scrollbar appears on long content, but **mouse wheel does not scroll**. Dragging the scrollbar thumb works.

## Architecture

```text
WebOnOne AppShell (embedMain=true, #main-content overflow-hidden)
  └── PlatformPeerFrame (peer=identity)
        └── PlatformServiceFrame → iframe (cross-origin)
              └── Identity PlatformEmbedLayout
                    └── PlatformEmbedShell
                          └── main.platform-embed-shell-main (overflow-y-auto) ← scroll root
                                └── ProfilePage / FeaturePage / ProfileForm
```

## Root cause

1. Embed canvas CSS (`usePlatformEmbedCanvas`) sets `overflow: hidden` on `html`, `body`, and `#root`.
2. Scroll is intended on `.platform-embed-shell-main` only.
3. In nested cross-origin iframes, wheel events may not apply to the flex scroll child consistently; scrollbar rendering still works via overflow layout.

## Fix

Add `useEmbedMainWheelScroll` in `@webonone/platform-embed`:

- Attach to `.platform-embed-shell-main` only when running in embed mode (`window.self !== window.top` or embed query params).
- On `wheel` (non-passive): compute `deltaY` (respect `deltaMode`), clamp `scrollTop`, call `preventDefault` when consuming the delta.
- Export via `PlatformEmbedShell` — all satellite embed layouts already use this shell.

## Files

| Path | Change |
|------|--------|
| `packages/platform-embed/src/useEmbedMainWheelScroll.ts` | New hook |
| `packages/platform-embed/src/PlatformEmbedShell.tsx` | `ref` on main + hook |
| `packages/platform-embed/src/index.ts` | Export hook (optional, for tests) |

## Acceptance

| # | Check |
|---|--------|
| 1 | WebOnOne logged in → Profile → wheel scrolls profile sections |
| 2 | Short viewport content: no erroneous scroll offset |
| 3 | Data/Email embed list pages: wheel scroll still works (no regression) |
| 4 | Standalone Identity `/profile` (no embed): wheel scroll works |

## ClickUp

Subtask **86ey61krq** (parent) — profile scroll wheel bug.
