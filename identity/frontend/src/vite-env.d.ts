/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_IDENTITY_API_BASE_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_ALLOWED_REDIRECT_URIS?: string
  readonly VITE_EMAIL_ORIGIN?: string
  readonly VITE_WEBONONE_API_BASE_URL?: string
  readonly VITE_MEDIA_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
