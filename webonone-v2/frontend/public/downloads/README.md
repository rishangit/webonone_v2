# Desktop installer (local dev)

Basic Settings → **Downloads** links to `/downloads/WebOnOne-Setup.exe`.

For local testing, copy the built installer here:

```text
desktop/release/WebOnOne-Setup.exe → webonone-v2/frontend/public/downloads/WebOnOne-Setup.exe
```

Production deploy copies the same file via `webonone-v2/deploy/stage-deploy.ps1` when you run `npm run build:desktop` before `npm run deploy:webonone`.
