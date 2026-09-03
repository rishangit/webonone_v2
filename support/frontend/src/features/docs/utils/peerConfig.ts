const DEFAULT_WEBONONE_ORIGIN = 'http://127.0.0.1:3010'
const DEFAULT_WEBSITE_ORIGIN = 'http://127.0.0.1:3018'

function trimOrigin(value: string | undefined, fallback: string): string {
  return (value?.trim() || fallback).replace(/\/$/, '')
}

export function getWebOnOneOrigin(): string {
  return trimOrigin(import.meta.env.VITE_WEBONONE_ORIGIN, DEFAULT_WEBONONE_ORIGIN)
}

export function getWebsiteOrigin(): string {
  return trimOrigin(import.meta.env.VITE_WEBSITE_ORIGIN, DEFAULT_WEBSITE_ORIGIN)
}
