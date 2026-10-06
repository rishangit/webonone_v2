import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectFromPaths, loadConfig } from './detect-changed-services.mjs';

describe('detectFromPaths', () => {
  const config = loadConfig();

  it('maps support and media only to selective two-service deploy', () => {
    const result = detectFromPaths(config, ['support/frontend/src/App.tsx', 'media/backend/src/index.ts']);
    assert.equal(result.mode, 'selective');
    assert.deepEqual(result.services, ['media', 'support']);
  });

  it('maps ui-kit and support to selective with all IIS services', () => {
    const result = detectFromPaths(config, [
      'ui-kit/package/src/layouts/AppShell.tsx',
      'support/frontend/src/foo.ts',
    ]);
    assert.equal(result.mode, 'selective');
    assert.equal(result.services.length, config.serviceOrder.length);
    assert.ok(result.reason.includes('ui-kit'));
  });

  it('ignores spec-only paths as none', () => {
    const result = detectFromPaths(config, ['spec/0027/development-summary.md', 'spec/0027/plan.md']);
    assert.equal(result.mode, 'none');
    assert.deepEqual(result.services, []);
  });

  it('force-full on root package.json', () => {
    const result = detectFromPaths(config, ['package.json']);
    assert.equal(result.mode, 'all');
    assert.equal(result.services.length, config.serviceOrder.length);
    assert.ok(result.reason.includes('force-full'));
  });
});
