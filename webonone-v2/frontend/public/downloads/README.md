# Desktop installer (local dev)

Basic Settings → **Downloads** links to `/downloads/WebOnOne-Setup.exe`.

For local testing, copy the built installer here:

```text
desktop/release/WebOnOne-Setup.exe → webonone-v2/frontend/public/downloads/WebOnOne-Setup.exe
```

Production deploy runs `npm run build:desktop` then copies the installer via `tooling/stage-iis-deploy.mjs` when you run `npm run deploy -w webonone-v2-root` (or root `npm run deploy:webonone`).
