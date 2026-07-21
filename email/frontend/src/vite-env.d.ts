/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_IDENTITY_ORIGIN?: string
  readonly VITE_IDENTITY_API_BASE_URL?: string
  readonly VITE_WEBONONE_ORIGIN?: string
  readonly VITE_WEBONONE_API_BASE_URL?: string
  readonly VITE_DATA_ORIGIN?: string
  readonly VITE_SMS_ORIGIN?: string
  readonly VITE_ALLOWED_PARENT_ORIGINS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
