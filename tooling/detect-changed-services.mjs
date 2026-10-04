/**
 * Detect which IIS-deployable services changed between two git refs.
 *
 * Usage (from repo root):
 *   node tooling/detect-changed-services.mjs --base HEAD~1 --head HEAD --print
 *   node tooling/detect-changed-services.mjs --services support,data --print
 *   node tooling/detect-changed-services.mjs --force-all --print
 *   node tooling/detect-changed-services.mjs --base <sha> --head <sha> --github-output
 *
 * Exit 0 always on successful detection. Prints JSON to stdout with --print.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(repoRoot, 'tooling', 'deploy-services.json');

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {{ base?: string, head?: string, services?: string, forceAll: boolean, print: boolean, githubOutput: boolean, help: boolean, files?: string }} */
  const out = {
    forceAll: false,
    print: false,
    githubOutput: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      out.help = true;
    } else if (arg === '--force-all') {
      out.forceAll = true;
    } else if (arg === '--print') {
      out.print = true;
    } else if (arg === '--github-output') {
      out.githubOutput = true;
    } else if (arg === '--base') {
      out.base = argv[++i];
    } else if (arg === '--head') {
      out.head = argv[++i];
    } else if (arg === '--services') {
      out.services = argv[++i];
    } else if (arg === '--files') {
      // Newline-separated paths (testing / workflow pipe); skips git
      out.files = argv[++i];
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node tooling/detect-changed-services.mjs --base <ref> --head <ref> [--print] [--github-output]
  node tooling/detect-changed-services.mjs --services <csv> [--print] [--github-output]
  node tooling/detect-changed-services.mjs --force-all [--print] [--github-output]
  node tooling/detect-changed-services.mjs --files <path-to-list> [--print]

Outputs mode=all|selective|none and a comma-separated services list.`);
}

/**
 * @param {string} ref
 */
function isNullOrZeroSha(ref) {
  if (!ref) return true;
  return /^0+$/.test(ref);
}

/**
 * @param {string} base
 * @param {string} head
 */
function gitDiffNames(base, head) {
  const result = spawnSync('git', ['diff', '--name-only', `${base}...${head}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    // Fallback without three-dot if base is not an ancestor
    const fallback = spawnSync('git', ['diff', '--name-only', base, head], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (fallback.status !== 0) {
      const err = (fallback.stderr || result.stderr || '').trim();
      throw new Error(`git diff failed: ${err || 'unknown error'}`);
    }
    return fallback.stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * @param {string} path
 */
function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * @param {ReturnType<typeof loadConfig>} config
 * @param {string[]} paths
 */
function detectFromPaths(config, paths) {
  const normalized = paths.map(normalizePath);
  const forcePrefixes = config.forceFullPathPrefixes || [];
  const forceExact = new Set(config.forceFullExactPaths || []);

  for (const path of normalized) {
    if (forceExact.has(path)) {
      return { mode: 'all', services: [...config.serviceOrder], reason: `force-full path: ${path}` };
    }
    for (const prefix of forcePrefixes) {
      if (path === prefix.replace(/\/$/, '') || path.startsWith(prefix)) {
        return { mode: 'all', services: [...config.serviceOrder], reason: `force-full prefix: ${prefix} (${path})` };
      }
    }
  }

  /** @type {Set<string>} */
  const selected = new Set();
  for (const path of normalized) {
    for (const key of config.serviceOrder) {
      const entry = config.services[key];
      for (const root of entry.roots) {
        const rootNorm = root.endsWith('/') ? root : `${root}/`;
        if (path === rootNorm.slice(0, -1) || path.startsWith(rootNorm)) {
          selected.add(key);
        }
      }
    }
  }

  const services = config.serviceOrder.filter((k) => selected.has(k));
  if (services.length === 0) {
    return { mode: 'none', services: [], reason: 'no deployable service paths changed' };
  }
  return {
    mode: 'selective',
    services,
    reason: `changed services: ${services.join(',')}`,
  };
}

function loadConfig() {
  if (!existsSync(configPath)) {
    throw new Error(`Missing ${configPath}`);
  }
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

/**
 * @param {string} csv
 * @param {ReturnType<typeof loadConfig>} config
 */
function parseServicesCsv(csv, config) {
  const keys = csv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const unknown = keys.filter((k) => !config.services[k]);
  if (unknown.length) {
    throw new Error(`Unknown service key(s): ${unknown.join(', ')}. Valid: ${config.serviceOrder.join(', ')}`);
  }
  const set = new Set(keys);
  return config.serviceOrder.filter((k) => set.has(k));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const config = loadConfig();

  /** @type {{ mode: string, services: string[], reason: string }} */
  let result;

  if (args.forceAll) {
    result = { mode: 'all', services: [...config.serviceOrder], reason: '--force-all' };
  } else if (args.services) {
    const services = parseServicesCsv(args.services, config);
    if (services.length === 0) {
      result = { mode: 'none', services: [], reason: '--services empty' };
    } else {
      result = { mode: 'selective', services, reason: `--services ${services.join(',')}` };
    }
  } else if (args.files) {
    if (!existsSync(args.files)) {
      throw new Error(`--files not found: ${args.files}`);
    }
    const paths = readFileSync(args.files, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    result = detectFromPaths(config, paths);
  } else {
    const base = args.base;
    const head = args.head || 'HEAD';
    if (!base || isNullOrZeroSha(base)) {
      result = {
        mode: 'all',
        services: [...config.serviceOrder],
        reason: 'missing or zero base SHA (full deploy)',
      };
    } else {
      const paths = gitDiffNames(base, head);
      if (paths.length === 0) {
        result = { mode: 'none', services: [], reason: 'empty git diff' };
      } else {
        result = detectFromPaths(config, paths);
      }
    }
  }

  if (args.print || !args.githubOutput) {
    console.log(JSON.stringify(result, null, 2));
  }
  if (args.githubOutput) {
    const outFile = process.env.GITHUB_OUTPUT;
    if (!outFile) {
      throw new Error('--github-output requires GITHUB_OUTPUT');
    }
    const pools = result.services.map((k) => config.services[k].appPool).filter(Boolean);
    const urls = result.services.map((k) => config.services[k].healthUrl).filter(Boolean);
    appendFileSync(
      outFile,
      [
        `mode=${result.mode}`,
        `services=${result.services.join(',')}`,
        `app_pools=${pools.join(',')}`,
        `health_urls=${urls.join(',')}`,
        `reason=${result.reason.replace(/\r?\n/g, ' ')}`,
      ].join('\n') + '\n',
      'utf8',
    );
    console.error(
      `detect-changed-services: mode=${result.mode} services=${result.services.join(',') || '(none)'} (${result.reason})`,
    );
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
