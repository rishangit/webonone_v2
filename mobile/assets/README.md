# App icons

| File | Size | Used for |
|------|------|----------|
| `icon.png` | **1024×1024** PNG | White background + centered black mark — Expo `icon` |
| `adaptive-icon.png` | **1024×1024** PNG | Transparent PNG, black mark only — Android adaptive foreground |

Mark geometry comes from `ui-kit/package/src/assets/webonone-logo.svg`. Regenerate PNGs and native mipmaps after brand changes:

```bash
npm run generate-icons -w @webonone/mobile
cd mobile && npx expo prebuild --platform android --no-install
```

Then rebuild the Android app (`npm run mobile:android` or your release build).
