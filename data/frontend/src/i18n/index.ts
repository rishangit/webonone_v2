import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enTags from '@/locales/en/tags.json'
import siTags from '@/locales/si/tags.json'
import enProducts from '@/locales/en/products.json'
import siProducts from '@/locales/si/products.json'
import enServices from '@/locales/en/services.json'
import siServices from '@/locales/si/services.json'
import enSpaces from '@/locales/en/spaces.json'
import siSpaces from '@/locales/si/spaces.json'
import enUnits from '@/locales/en/units.json'
import siUnits from '@/locales/si/units.json'
import enAttributes from '@/locales/en/attributes.json'
import siAttributes from '@/locales/si/attributes.json'

export const NAMESPACES = ['shell', 'tags', 'products', 'services', 'spaces', 'units', 'attributes'] as const

export function initDataI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        tags: enTags,
        products: enProducts,
        services: enServices,
        spaces: enSpaces,
        units: enUnits,
        attributes: enAttributes,
      },
      si: {
        shell: siShell,
        tags: siTags,
        products: siProducts,
        services: siServices,
        spaces: siSpaces,
        units: siUnits,
        attributes: siAttributes,
      },
    },
  })
}

export { getAppI18n }
