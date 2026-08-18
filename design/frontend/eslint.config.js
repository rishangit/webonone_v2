import { createReactAppConfig } from '../../eslint.react.config.mjs'

export default [
  { ignores: ['src/**/*.test.ts'] },
  ...createReactAppConfig(import.meta.dirname),
]
