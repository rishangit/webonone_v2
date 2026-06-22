/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WEBONONE_API_BASE_URL?: string
  readonly VITE_IDENTITY_ORIGIN?: string
  readonly VITE_IDENTITY_API_BASE_URL?: string
  readonly VITE_MEDIA_ORIGIN?: string
  readonly VITE_MEDIA_API_BASE_URL?: string
  readonly VITE_DEMO_SITE_ID?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
