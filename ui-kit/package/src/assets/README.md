# Platform brand assets

| Asset | Format | Purpose |
|-------|--------|---------|
| `webonone-logo.svg` | SVG (vector) | WebOnOne header mark — synced into `WebOnOneLogoMark.tsx` |

**Header display:** 32px tall (`h-8`), width scales from viewBox `160×139`.

**Replace the logo:** edit `webonone-logo.svg`, then copy the `<path>` `d` attribute into `src/components/WebOnOneLogoMark.tsx`.

Optional raster fallback: transparent PNG **128px** or **256px** on the longest side (not used in header by default).
