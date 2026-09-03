/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WEBONONE_ORIGIN?: string
  readonly VITE_IDENTITY_ORIGIN?: string
  readonly VITE_IDENTITY_API_BASE_URL?: string
  readonly VITE_AI_ORIGIN?: string
  readonly VITE_AI_API_BASE_URL?: string
  readonly VITE_SUPPORT_ORIGIN?: string
  readonly VITE_CLEAR_SESSION_ALLOWED_ORIGINS?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
