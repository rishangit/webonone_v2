/**
 * Migrate and deploy selected services (or all / none).
 *
 * Usage (from repo root, after npm install + env:apply):
 *   node tooling/deploy-changed.mjs --force-all
 *   node tooling/deploy-changed.mjs --services support,data
 *   node tooling/deploy-changed.mjs --mode none
 *   node tooling/deploy-changed.mjs --base <sha> --head <sha>
 *
 * Prefer npm run deploy:changed -- --services support
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const detectScript = join(repoRoot, 'tooling', 'detect-changed-services.mjs');
const configPath = join(repoRoot, 'tooling', 'deploy-services.json');

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {{ base?: string, head?: string, services?: string, mode?: string, forceAll: boolean, skipMigrate: boolean, help: boolean }} */
  const out = { forceAll: false, skipMigrate: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--all' || arg === '--force-all') out.forceAll = true;
    else if (arg === '--skip-migrate') out.skipMigrate = true;
    else if (arg === '--base') out.base = argv[++i];
    else if (arg === '--head') out.head = argv[++i];
    else if (arg === '--services') out.services = argv[++i];
    else if (arg === '--mode') out.mode = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return out;
}

/**
 * @param {string} script
 */
function runNpm(script) {
  console.log(`\n==> npm run ${script}`);
  const result = spawnSync('npm', ['run', script], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error(`npm run ${script} failed with exit ${result.status ?? 1}`);
  }
}

/**
 * @param {string[]} detectArgs
 */
function runDetect(detectArgs) {
  const result = spawnSync(process.execPath, [detectScript, ...detectArgs, '--print'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'detect-changed-services failed').trim());
  }
  return JSON.parse(result.stdout);
}

function loadConfig() {
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

/**
 * Resolve selection, write GITHUB_OUTPUT-style env hints for the workflow when requested.
 * @param {{ mode: string, services: string[], reason: string }} selection
 */
function emitSelectionEnv(selection) {
  const config = loadConfig();
  const pools = selection.services.map((k) => config.services[k].appPool).filter(Boolean);
  const urls = selection.services.map((k) => config.services[k].healthUrl).filter(Boolean);
  if (process.env.GITHUB_OUTPUT) {
    const lines = [
      `mode=${selection.mode}`,
      `services=${selection.services.join(',')}`,
      `app_pools=${pools.join(',')}`,
      `health_urls=${urls.join(',')}`,
      `reason=${selection.reason.replace(/\r?\n/g, ' ')}`,
    ];
    writeFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`, { flag: 'a', encoding: 'utf8' });
  }
  return { pools, urls };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  node tooling/deploy-changed.mjs --force-all
  node tooling/deploy-changed.mjs --services support,data
  node tooling/deploy-changed.mjs --base <sha> --head HEAD
  node tooling/deploy-changed.mjs --mode none`);
    process.exit(0);
  }

  /** @type {{ mode: string, services: string[], reason: string }} */
  let selection;

  if (args.mode === 'none') {
    selection = { mode: 'none', services: [], reason: '--mode none' };
  } else if (args.forceAll || args.mode === 'all') {
    selection = runDetect(['--force-all']);
  } else if (args.services) {
    selection = runDetect(['--services', args.services]);
  } else if (args.mode === 'selective' && process.env.DEPLOY_SERVICES) {
    selection = runDetect(['--services', process.env.DEPLOY_SERVICES]);
  } else if (args.base) {
    selection = runDetect(['--base', args.base, '--head', args.head || 'HEAD']);
  } else if (process.env.DEPLOY_MODE === 'all') {
    selection = runDetect(['--force-all']);
  } else if (process.env.DEPLOY_SERVICES) {
    selection = runDetect(['--services', process.env.DEPLOY_SERVICES]);
  } else if (process.env.DEPLOY_BASE_SHA) {
    selection = runDetect([
      '--base',
      process.env.DEPLOY_BASE_SHA,
      '--head',
      process.env.DEPLOY_HEAD_SHA || 'HEAD',
    ]);
  } else {
    throw new Error(
      'Specify --all, --services <csv>, --base <sha>, or set DEPLOY_BASE_SHA / DEPLOY_SERVICES',
    );
  }

  console.log(
    `deploy-changed: mode=${selection.mode} services=${selection.services.join(',') || '(none)'} (${selection.reason})`,
  );
  const { pools, urls } = emitSelectionEnv(selection);

  // Persist for subsequent workflow steps when not using GITHUB_OUTPUT from detect step
  if (process.env.DEPLOY_SELECTION_FILE) {
    writeFileSync(
      process.env.DEPLOY_SELECTION_FILE,
      JSON.stringify({ ...selection, appPools: pools, healthUrls: urls }, null, 2),
      'utf8',
    );
  }

  if (selection.mode === 'none') {
    console.log('No services to migrate or deploy. Skipping.');
    return;
  }

  const config = loadConfig();

  if (selection.mode === 'all') {
    if (!args.skipMigrate) {
      runNpm('migrate:all');
    }
    for (const key of config.serviceOrder) {
      const entry = config.services[key];
      runNpm(entry.deploy);
    }
    console.log(`deploy-changed: finished ${config.serviceOrder.length} service(s) (force-full).`);
    return;
  }

  for (const key of selection.services) {
    const entry = config.services[key];
    if (!args.skipMigrate) {
      runNpm(entry.migrate);
    }
    runNpm(entry.deploy);
  }

  console.log(`deploy-changed: finished ${selection.services.length} service(s).`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
