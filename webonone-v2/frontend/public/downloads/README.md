# Desktop installer (local dev)

Basic Settings → **Downloads** links to `/downloads/WebOnOne-Setup.exe`.

For local testing, copy the built installer here:

```text
desktop/release/WebOnOne-Setup.exe → webonone-v2/frontend/public/downloads/WebOnOne-Setup.exe
```

Production deploy best-effort packages the installer (`tooling/build-desktop-for-deploy.mjs`) then copies it via `tooling/stage-iis-deploy.mjs` when you run `npm run deploy -w webonone-v2-root` (or root `npm run deploy:webonone`). Low-RAM hosts may skip packaging; use `npm run build:desktop` when you need a new Setup.exe.
