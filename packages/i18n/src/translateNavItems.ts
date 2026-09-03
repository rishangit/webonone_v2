import type { TFunction } from 'i18next'

/** Map English platform-nav labels → common:nav.* keys. */
export const NAV_LABEL_KEYS: Record<string, string> = {
  Home: 'nav.home',
  Dashboard: 'nav.dashboard',
  Analytics: 'nav.analytics',
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
  'Basic Settings': 'nav.basicSettings',
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
  Website: 'nav.website',
  'Test Email': 'nav.testEmail',
  Providers: 'nav.providers',
  Library: 'nav.library',
  Components: 'nav.components',
  'User register': 'nav.userRegister',
  'Reset password': 'nav.resetPassword',
}

function translateLabel(t: TFunction, label: string): string {
  const key = NAV_LABEL_KEYS[label]
  if (!key) return label
  const translated = t(key)
  return typeof translated === 'string' ? translated : label
}

type NavLike = {
  type: string
  label: string
  children?: Array<{ label: string }>
}

export function translateNavItems<T extends NavLike>(items: T[], t: TFunction): T[] {
  return items.map((item) => {
    if (item.type === 'item' || !item.children) {
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
