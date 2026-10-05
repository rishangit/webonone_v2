/**
 * Best-effort Electron NSIS build for WebOnOne IIS deploy.
 *
 * Staging self-hosted runners often have ~4 GB RAM; electron-builder can fail
 * with WebAssembly.Memory() OOM. IIS web deploy must not hard-fail on that.
 *
 * Hard packaging for capable machines: npm run build:desktop
 *
 * Env:
 *   SKIP_DESKTOP_BUILD=1 — skip without attempting electron-builder
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { freemem, totalmem } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const installerPath = join(repoRoot, 'desktop', 'release', 'WebOnOne-Setup.exe');

/** Below this free RAM, skip electron-builder (WASM allocate fails on thin hosts). */
const MIN_FREE_BYTES = 1.5 * 1024 * 1024 * 1024;

function formatMb(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function skip(reason) {
  console.warn(`[build-desktop-for-deploy] Skipping desktop installer: ${reason}`);
  if (existsSync(installerPath)) {
    console.warn(
      `[build-desktop-for-deploy] Existing installer will be staged if present: ${installerPath}`,
    );
  } else {
    console.warn(
      '[build-desktop-for-deploy] No WebOnOne-Setup.exe yet — download link may 404 until you run npm run build:desktop on a machine with enough RAM.',
    );
  }
  process.exit(0);
}

function main() {
  if (process.env.SKIP_DESKTOP_BUILD === '1') {
    skip('SKIP_DESKTOP_BUILD=1');
  }

  const free = freemem();
  const total = totalmem();
  console.log(
    `[build-desktop-for-deploy] Memory: free=${formatMb(free)} total=${formatMb(total)}`,
  );

  if (free < MIN_FREE_BYTES) {
    skip(
      `free RAM ${formatMb(free)} < ${formatMb(MIN_FREE_BYTES)} (electron-builder needs headroom; staging hosts often OOM with WebAssembly.Memory)`,
    );
  }

  console.log('[build-desktop-for-deploy] Running npm run dist -w @webonone/desktop …');
  const result = spawnSync('npm', ['run', 'dist', '-w', '@webonone/desktop'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: 'false',
    },
  });

  if (result.status !== 0) {
    console.warn(
      `[build-desktop-for-deploy] Desktop packaging failed (exit ${result.status ?? 1}). Continuing IIS deploy without a new installer.`,
    );
    console.warn(
      '[build-desktop-for-deploy] To publish WebOnOne-Setup.exe, run npm run build:desktop on a host with enough free RAM.',
    );
    process.exit(0);
  }

  if (existsSync(installerPath)) {
    console.log(`[build-desktop-for-deploy] Installer ready: ${installerPath}`);
  } else {
    console.warn(
      `[build-desktop-for-deploy] dist succeeded but installer missing at ${installerPath}`,
    );
  }
  process.exit(0);
}

main();
