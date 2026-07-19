/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IDENTITY_ORIGIN?: string
  readonly VITE_MEDIA_ORIGIN?: string
  readonly VITE_DATA_ORIGIN?: string
  readonly VITE_SHOWCASE_ACCESS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
