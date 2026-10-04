/**
 * Resolve health smoke URLs for a selective deploy.
 *
 * Usage:
 *   node tooling/resolve-smoke-urls.mjs --services support,data
 *   SMOKE_HEALTH_URLS=... node tooling/resolve-smoke-urls.mjs --services support
 *
 * Prints a comma-separated URL list to stdout (for SMOKE_HEALTH_URLS).
 * When SMOKE_HEALTH_URLS is set, filters that list by each service's
 * smokeHostSubstrings; otherwise uses default healthUrl from deploy-services.json.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(repoRoot, 'tooling', 'deploy-services.json');
const defaultSmokePath = join(repoRoot, 'tooling', 'smoke-health-urls.json');

function parseArgs(argv) {
  /** @type {{ services?: string, help: boolean }} */
  const out = { help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--services') out.services = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node tooling/resolve-smoke-urls.mjs --services support,data');
    process.exit(0);
  }
  if (!args.services || !args.services.trim()) {
    console.error('--services is required');
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const keys = args.services
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const substrings = [];
  const defaults = [];
  for (const key of keys) {
    const entry = config.services[key];
    if (!entry) {
      console.error(`Unknown service: ${key}`);
      process.exit(1);
    }
    defaults.push(entry.healthUrl);
    for (const s of entry.smokeHostSubstrings || []) {
      substrings.push(s.toLowerCase());
    }
  }

  const override = (process.env.SMOKE_HEALTH_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let candidate = override;
  if (candidate.length === 0 && existsSync(defaultSmokePath)) {
    const smoke = JSON.parse(readFileSync(defaultSmokePath, 'utf8'));
    candidate = [...(smoke.healthUrls || [])];
  }
  if (candidate.length === 0) {
    candidate = defaults;
  }

  const matched = candidate.filter((url) => {
    const lower = url.toLowerCase();
    return substrings.some((sub) => lower.includes(sub));
  });

  const urls = matched.length > 0 ? matched : defaults;
  process.stdout.write(urls.join(','));
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
