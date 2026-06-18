export const IDENTITY_API_BASE =
  import.meta.env.VITE_IDENTITY_API_BASE_URL ?? 'http://localhost:4001/api/v1'

export const IDENTITY_LOGIN_URL =
  import.meta.env.VITE_IDENTITY_LOGIN_URL ?? 'http://localhost:3001/login'

export const AUTH_CALLBACK_URL =
  import.meta.env.VITE_AUTH_CALLBACK_URL ?? 'http://localhost:3000/callback'
