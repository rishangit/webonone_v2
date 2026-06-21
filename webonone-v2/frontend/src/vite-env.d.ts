/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WEBONONE_API_BASE_URL?: string
  readonly VITE_IDENTITY_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
