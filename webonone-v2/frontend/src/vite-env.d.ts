/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WEBONONE_API_BASE_URL?: string
  readonly VITE_IDENTITY_ORIGIN?: string
  readonly VITE_IDENTITY_API_BASE_URL?: string
  readonly VITE_MEDIA_ORIGIN?: string
  readonly VITE_EMAIL_ORIGIN?: string
  readonly VITE_DATA_ORIGIN?: string
  readonly VITE_SMS_ORIGIN?: string
  readonly VITE_PAYMENT_ORIGIN?: string
  readonly VITE_WEBSITE_ORIGIN?: string
  readonly VITE_WEBSITE_ALLOWED_ORIGINS?: string
  readonly VITE_CLEAR_SESSION_ALLOWED_ORIGINS?: string
  readonly VITE_DESIGN_ORIGIN?: string
  readonly VITE_DESIGN_API_BASE_URL?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
