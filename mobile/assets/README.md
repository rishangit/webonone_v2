# App icons

| File | Size | Used for |
|------|------|----------|
| `icon.png` | **1024×1024** PNG | White background + centered black mark — Expo `icon`, iOS notification badge uses app icon |
| `adaptive-icon.png` | **1024×1024** PNG | Transparent PNG, black mark only — Android adaptive foreground |
| `notification-icon.png` | **96×96** PNG | **White** mark on transparent — Android status-bar / tray small icon (`expo-notifications`) |

Mark geometry comes from `ui-kit/package/src/assets/webonone-logo.svg`. Regenerate PNGs and native drawables after brand changes:

```bash
npm run generate-icons -w @webonone/mobile
cd mobile && npx expo prebuild --platform android --no-install
```

Then rebuild the Android app (`npm run mobile:android` or your release build).

Android also copies `notification_icon.png` into `android/app/src/main/res/drawable-*dpi/` when you run `generate-icons`.
