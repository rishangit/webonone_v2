# Plan — Feedback 0018

## Approach

Stop treating electron-builder as a hard dependency of WebOnOne IIS deploy. Add a deploy-time helper that skips or soft-fails desktop packaging on low-memory hosts (the staging runner has ~4 GB RAM), while keeping `npm run build:desktop` as the intentional hard build.

## Implementation steps

1. **Add `tooling/build-desktop-for-deploy.mjs`**
   - Honor `SKIP_DESKTOP_BUILD=1` → skip, exit 0.
   - If free physical memory is below a safe threshold (~1.5 GB on Windows via `os.freemem()`), skip with warning, exit 0 (avoid thrashing).
   - Otherwise run `npm run dist -w @webonone/desktop` with `CSC_IDENTITY_AUTO_DISCOVERY=false`.
   - On non-zero exit: log warning referencing WebAssembly / RAM, exit 0.
   - On success: log that installer is ready for staging copy.

2. **Wire `webonone-v2/package.json` `deploy`**
   - Replace `npm run build:desktop --prefix ..` with `node ../tooling/build-desktop-for-deploy.mjs`.
   - Leave root `build:desktop` unchanged for manual packaging.

3. **Docs**
   - `webonone-v2/deploy/IIS.md` — deploy attempts installer packaging; may skip on low RAM; use `npm run build:desktop` when publishing a new Setup.exe.
   - `tooling/CICD.md` — note desktop soft-skip on constrained self-hosted runners.

4. **Verify** — `node --check` on the helper; `npm run type-check -w @webonone/desktop`. Optionally run the helper once to confirm skip path on this host.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Download link may 404 until an installer is built on a machine with enough RAM and copied/staged — already warned by `stage-iis-deploy.mjs`.
- Do not soft-fail `npm run build:desktop` itself; only the deploy helper is non-fatal.
- Prefer skip-before-try when free RAM is clearly insufficient so deploy does not worsen host pressure.
