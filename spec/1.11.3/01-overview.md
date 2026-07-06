# 01 — Overview (1.11.3)

## Vision

After 1.11.x iframe platform embeds, WebOnOne core loads Identity **Profile** inside `#main-content` via `PlatformServiceFrame`. Users must be able to scroll long profile content with the **mouse wheel**, not only by dragging the scrollbar thumb.

## User story

As a WebOnOne user on the Profile page (embedded from Identity), I want the mouse scroll wheel to scroll the profile content so I can read and edit fields without using the scrollbar.

## ClickUp source (parent)

> In core when navigate to the profile page, profile page loads with the scroll but when I use the mouse scroll wheel to scroll it not working — fix the issue scroll bar need to work with the mouse wheel.

## Goals (1.11.3)

1. **Wheel scroll works** on Profile when embedded from WebOnOne (`/profile` route).
2. **Scrollbar drag unchanged** — existing overflow layout preserved.
3. **Cross-service embed safe** — fix lives in `@webonone/platform-embed` so Data/Email/Identity embeds benefit.
4. **No auth or nav regression** — auth-code handoff and platform nav unchanged.

## Root cause (summary)

Platform embed mode (`platform-embed-canvas`) locks `html`, `body`, and `#root` to `overflow: hidden` and delegates scrolling to `.platform-embed-shell-main`. In cross-origin iframes (WebOnOne host → Identity peer), some browsers fail to apply wheel deltas to that flex scroll region even when a scrollbar is visible. The host cannot access `contentDocument` to forward events; the fix must run **inside** the embedded app on the scroll root.

## Scope (1.11.3)

### In scope

- `packages/platform-embed`: wheel scroll helper on embed shell main
- `PlatformEmbedShell` wiring (Identity, Data, Email already use this component)
- Manual acceptance on WebOnOne → Profile

### Out of scope

- Standalone Identity profile (non-embed) unless broken by shared shell change
- WebOnOne `#main-content` scroll (embed routes use `embedMain` + internal scroll)
- Profile form fields / API changes

## Success criteria

1. WebOnOne `/profile` — mouse wheel scrolls profile content up and down.
2. Scrollbar thumb drag still works.
3. `npm run type-check` passes for `platform-embed`, `identity-root`, `webonone-v2-root`.
4. No double-scroll or scroll jitter on short pages that fit the viewport.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Profile scroll wheel | 86ey61krq | All docs |
