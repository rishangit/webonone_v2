# 03 — WebOnOne Media Demo Removal

The 1.4.0 **media demo** on WebOnOne was a reference integration for profile viewer/selector. Spec 1.5.0 moves profile image editing to **Identity**; the demo is no longer needed in the core product shell.

---

## Remove

| Item | Path |
|------|------|
| Nav item | `webonone-v2/frontend/src/features/shell/config/navItems.ts` — `Media demo` entry |
| Route | `webonone-v2/frontend/src/app/router.tsx` — `demo/media` |
| Page | `webonone-v2/frontend/src/features/media/pages/MediaDemoPage.tsx` |

## Remove if unused after page deletion

| Item | Path |
|------|------|
| `MediaViewerEmbed.tsx` | Only used by demo |
| `MediaUploadDialogModal.tsx` | Only used by demo |
| `MediaSelectorModal.tsx` | Only used by demo |

Keep `mediaConfig.ts`, `MediaPickerModal.tsx`, and `useMediaSelection.ts` if still referenced elsewhere; otherwise remove dead code.

---

## Keep

- `@webonone/media-embed` dependency on WebOnOne (future site editor).
- `VITE_MEDIA_ORIGIN` in `webonone-v2/frontend/.env.example` if site features will use Media later.

---

## Acceptance

- Main nav shows Home + Settings only (no Media demo).
- Navigating to `/demo/media` redirects to `/` or 404.
- No TypeScript errors from removed imports.
