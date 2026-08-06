import type { TFunction } from 'i18next'
import type { NavConfigItem } from '@webonone/ui-kit'

/** Map platform-nav English labels → shell:nav.* keys. */
const NAV_LABEL_KEYS: Record<string, string> = {
  Home: 'nav.home',
  Calendar: 'nav.calendar',
  Schedule: 'nav.schedule',
  Events: 'nav.events',
  Staff: 'nav.staff',
  Settings: 'nav.settings',
  Companies: 'nav.companies',
  'My Companies': 'nav.myCompanies',
  'Connected Companies': 'nav.connectedCompanies',
  'All Companies': 'nav.allCompanies',
  Catalog: 'nav.catalog',
  Data: 'nav.data',
  Email: 'nav.email',
  SMS: 'nav.sms',
  Payment: 'nav.payment',
  Design: 'nav.design',
  Profile: 'nav.profile',
  Identity: 'nav.identity',
  'Basic Settings': 'nav.basicSettingsTitle',
  'System Theme': 'nav.systemTheme',
  Products: 'nav.products',
  Services: 'nav.services',
  Spaces: 'nav.spaces',
  Tags: 'nav.tags',
  Units: 'nav.units',
  Attributes: 'nav.attributes',
  Users: 'nav.users',
  Send: 'nav.send',
  'Send Email': 'nav.sendEmail',
  'Send SMS': 'nav.sendSms',
  Queue: 'nav.queue',
  History: 'nav.history',
  'Email History': 'nav.emailHistory',
  Templates: 'nav.templates',
  Devices: 'nav.devices',
  Invoices: 'nav.invoices',
  Forms: 'nav.forms',
}

function translateLabel(t: TFunction, label: string): string {
  const key = NAV_LABEL_KEYS[label]
  return key ? t(key) : label
}

export function translateNavItems(items: NavConfigItem[], t: TFunction): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item') {
      return { ...item, label: translateLabel(t, item.label) }
    }
    return {
      ...item,
      label: translateLabel(t, item.label),
      children: item.children.map((child) => ({
        ...child,
        label: translateLabel(t, child.label),
      })),
    }
  })
}
