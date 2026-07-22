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
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest
  const base = moduleName.split('/')[0]
  if (reactSingletons.has(base)) {
    return resolve({ ...context, originModulePath: reactAnchor }, moduleName, platform)
  }
  return resolve(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })
