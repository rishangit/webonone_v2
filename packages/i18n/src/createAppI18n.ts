import i18n, { type i18n as I18nInstance, type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import siCommon from './locales/si/common.json'
import { DEFAULT_LOCALE } from './constants'
import { resolveInitialLocale } from './localeStorage'
import { applyLocaleFromQueryParams } from './urlLocale'

export const COMMON_NAMESPACE = 'common'

export const commonResources: Resource = {
  en: { [COMMON_NAMESPACE]: enCommon },
  si: { [COMMON_NAMESPACE]: siCommon },
}

export type CreateAppI18nOptions = {
  /** Extra resources merged on top of shared `common` (service feature packs). */
  resources?: Resource
  /** Namespace list. `common` is always included. */
  ns?: string[]
  defaultNS?: string
  /** Override initial language (otherwise query → storage → browser → en). */
  lng?: string | null
  /** When true (default), read `lng` from `window.location.search` before init. */
  applyQueryParams?: boolean
}

function mergeResources(extra?: Resource): Resource {
  if (!extra) return commonResources
  const merged: Resource = {
    en: { ...(commonResources.en ?? {}) },
    si: { ...(commonResources.si ?? {}) },
  }
  for (const [lng, namespaces] of Object.entries(extra)) {
    if (!namespaces) continue
    merged[lng] = { ...(merged[lng] ?? {}), ...namespaces }
  }
  return merged
}

/**
 * Create and initialize a shared i18next instance for a service frontend.
 * English is always the fallback. Call once from `main.tsx` before render.
 */
export function createAppI18n(options: CreateAppI18nOptions = {}): I18nInstance {
  const {
    resources,
    ns = [COMMON_NAMESPACE],
    defaultNS = COMMON_NAMESPACE,
    lng,
    applyQueryParams = true,
  } = options

  let fromQuery: string | null = null
  if (applyQueryParams && typeof window !== 'undefined') {
    fromQuery = applyLocaleFromQueryParams(new URLSearchParams(window.location.search))
  }

  const initialLng = resolveInitialLocale(lng ?? fromQuery)
  const namespaces = ns.includes(COMMON_NAMESPACE) ? ns : [COMMON_NAMESPACE, ...ns]

  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources: mergeResources(resources),
      lng: initialLng,
      fallbackLng: DEFAULT_LOCALE,
      defaultNS,
      ns: namespaces,
      interpolation: { escapeValue: false },
      returnNull: false,
    })
  } else {
    const merged = mergeResources(resources)
    for (const [lang, namespacesMap] of Object.entries(merged)) {
      if (!namespacesMap) continue
      for (const [namespace, bundle] of Object.entries(namespacesMap)) {
        i18n.addResourceBundle(lang, namespace, bundle, true, true)
      }
    }
    void i18n.changeLanguage(initialLng)
  }

  return i18n
}

export function getAppI18n(): I18nInstance {
  return i18n
}
