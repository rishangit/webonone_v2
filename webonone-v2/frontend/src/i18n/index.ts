import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import enAuth from '@/locales/en/auth.json'
import enProfile from '@/locales/en/profile.json'
import enHome from '@/locales/en/home.json'
import enSettings from '@/locales/en/settings.json'
import enStaff from '@/locales/en/staff.json'
import enCalendar from '@/locales/en/calendar.json'
import enCatalog from '@/locales/en/catalog.json'
import enSales from '@/locales/en/sales.json'
import enAnalytics from '@/locales/en/analytics.json'
import enSession from '@/locales/en/session.json'
import siShell from '@/locales/si/shell.json'
import siAuth from '@/locales/si/auth.json'
import siProfile from '@/locales/si/profile.json'
import siHome from '@/locales/si/home.json'
import siSettings from '@/locales/si/settings.json'
import siStaff from '@/locales/si/staff.json'
import siCalendar from '@/locales/si/calendar.json'
import siCatalog from '@/locales/si/catalog.json'
import siSales from '@/locales/si/sales.json'
import siAnalytics from '@/locales/si/analytics.json'
import siSession from '@/locales/si/session.json'

export const WEBONONE_NAMESPACES = [
  'shell',
  'auth',
  'profile',
  'home',
  'settings',
  'staff',
  'calendar',
  'catalog',
  'sales',
  'analytics',
  'session',
] as const

export function initWebOnOneI18n() {
  return createAppI18n({
    ns: [...WEBONONE_NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        auth: enAuth,
        profile: enProfile,
        home: enHome,
        settings: enSettings,
        staff: enStaff,
        calendar: enCalendar,
        catalog: enCatalog,
        sales: enSales,
        analytics: enAnalytics,
        session: enSession,
      },
      si: {
        shell: siShell,
        auth: siAuth,
        profile: siProfile,
        home: siHome,
        settings: siSettings,
        staff: siStaff,
        calendar: siCalendar,
        catalog: siCatalog,
        sales: siSales,
        analytics: siAnalytics,
        session: siSession,
      },
    },
  })
}

export { getAppI18n }
