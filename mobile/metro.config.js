// Metro config for the monorepo: watch the repo root so workspace packages
// (@webonone/theme, @webonone/store-kit) resolve from the hoisted node_modules.
//
// Keep Metro's server root at this app (not the npm workspace root). Otherwise
// Android release bundling relativizes entry to `./index.js` and resolves it
// from the monorepo root, which fails. Watch folders below still cover the repo.
process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1'

const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Gradle codegen under hoisted node_modules (Windows Metro watcher ENOENT during run:android).
// Do not require metro-config internals — Node 24 on Windows then loads this file as ESM
// and fails with ERR_UNSUPPORTED_ESM_URL_SCHEME (protocol 'd:').
const extraBlockList = [
  /[/\\]node_modules[/\\].*[/\\]android[/\\]build[/\\].*/,
  /[/\\]node_modules[/\\].*[/\\]ios[/\\]build[/\\].*/,
  /[/\\]mobile[/\\]android[/\\]build[/\\].*/,
]
const existingBlockList = config.resolver.blockList
config.resolver.blockList = existingBlockList
  ? [existingBlockList, ...extraBlockList].flat()
  : extraBlockList

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// The repo root pins React 19.2.7 (web services) while Expo/React Native require
// React 19.1.0 (mobile/node_modules/react). Hierarchical lookup is kept ON so
// nested transitive deps (e.g. is-arrayish under simple-swizzle) resolve, but the
// React singletons are forced to the app-local copy to avoid a renderer mismatch.
const reactSingletons = new Set(['react', 'react-dom'])
const reactAnchor = path.join(projectRoot, 'node_modules', 'react', 'index.js')
const defaultResolveRequest = config.resolver.resolveRequest
const sourcePackages = {
  '@webonone/platform-nav': path.join(workspaceRoot, 'packages/platform-nav/src/index.ts'),
  '@webonone/mobile-ui': path.join(workspaceRoot, 'packages/mobile-ui/src/index.ts'),
  '@webonone/i18n': path.join(workspaceRoot, 'packages/i18n/src/index.ts'),
}

const localePackages = {
  '@locales/webonone': path.join(workspaceRoot, 'webonone-v2/frontend/src/locales'),
  '@locales/identity': path.join(workspaceRoot, 'identity/frontend/src/locales'),
  '@locales/data': path.join(workspaceRoot, 'data/frontend/src/locales'),
  '@locales/sms': path.join(workspaceRoot, 'sms/frontend/src/locales'),
  '@locales/email': path.join(workspaceRoot, 'email/frontend/src/locales'),
  '@locales/payment': path.join(workspaceRoot, 'payment/frontend/src/locales'),
  '@locales/design': path.join(workspaceRoot, 'design/frontend/src/locales'),
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest
  if (sourcePackages[moduleName]) {
    return { filePath: sourcePackages[moduleName], type: 'sourceFile' }
  }
  for (const [prefix, localeRoot] of Object.entries(localePackages)) {
    if (moduleName === prefix || moduleName.startsWith(`${prefix}/`)) {
      const rest = moduleName.slice(prefix.length).replace(/^\//, '')
      return { filePath: path.join(localeRoot, rest), type: 'sourceFile' }
    }
  }
  const base = moduleName.split('/')[0]
  if (reactSingletons.has(base)) {
    return resolve({ ...context, originModulePath: reactAnchor }, moduleName, platform)
  }
  return resolve(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })
