/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_IDENTITY_ORIGIN?: string
  readonly VITE_IDENTITY_API_BASE_URL?: string
  readonly VITE_ALLOWED_PARENT_ORIGINS?: string
  readonly VITE_AI_ORIGIN?: string
  readonly VITE_AI_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
