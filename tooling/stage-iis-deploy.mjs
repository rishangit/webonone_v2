/**
 * Stage a microservice build into {service}/deploy for IIS.
 * Replaces deploy/stage-deploy.ps1 when PowerShell is unavailable or broken.
 *
 * Usage (from repo root):
 *   node tooling/stage-iis-deploy.mjs <service>/deploy [--clean-only]
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const deployArg = process.argv[2];
const cleanOnly = process.argv.includes('--clean-only');

if (!deployArg) {
  console.error('Usage: node tooling/stage-iis-deploy.mjs <service>/deploy [--clean-only]');
  process.exit(1);
}

const deployDir = resolve(repoRoot, deployArg);
const serviceRoot = dirname(deployDir);
const serviceName = basename(serviceRoot);
const keepNames = new Set([
  'web.config',
  'stage-deploy.ps1',
  'IIS.md',
  'configure-company-site-bindings.ps1',
  'issue-staging-company-site-cert.ps1',
  'namecheap-dns-acme.ps1',
  'deploy-paths.ps1',
  'deploy-paths.example.ps1',
]);

function clearDeployGenerated() {
  for (const name of readdirSync(deployDir)) {
    if (keepNames.has(name)) {
      continue;
    }
    rmSync(join(deployDir, name), { recursive: true, force: true });
  }
}

if (cleanOnly) {
  console.log(`Cleaning ${serviceName}\\deploy (keeping web.config, stage-deploy.ps1, IIS.md) ...`);
  clearDeployGenerated();
  console.log('Done.');
  process.exit(0);
}

const frontendDist = join(serviceRoot, 'frontend', 'dist');
const backendDist = join(serviceRoot, 'backend', 'dist');

if (!existsSync(frontendDist)) {
  console.error(
    `Frontend build not found at ${frontendDist}. Run npm run build -w ${serviceName}-root first.`,
  );
  process.exit(1);
}
if (!existsSync(backendDist)) {
  console.error(
    `Backend build not found at ${backendDist}. Run npm run build -w ${serviceName}-root first.`,
  );
  process.exit(1);
}

function resetStagedDirectory(path) {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

console.log(`Staging ${serviceName} for IIS in ${serviceName}\\deploy ...`);

const publicDir = join(deployDir, 'public');
const distDir = join(deployDir, 'dist');
const logsDir = join(deployDir, 'logs');

resetStagedDirectory(publicDir);
resetStagedDirectory(distDir);
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

cpSync(frontendDist, publicDir, { recursive: true });
cpSync(backendDist, distDir, { recursive: true });

console.log('');
console.log('Staging complete. IIS physical path:');
console.log(`  ${deployDir}`);
console.log('');
console.log('Folder contents:');
console.log('  web.config, stage-deploy.ps1, IIS.md');
console.log('  public\\   frontend build');
console.log('  dist\\     backend build');
console.log('  logs\\     Node stdout/stderr (created empty; IIS writes at runtime)');
console.log('');
console.log(`Runtime env: ${serviceName}\\backend\\.env`);
console.log('Runtime deps: repo root node_modules (npm install at repo root)');
