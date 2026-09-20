import { createAppI18n, getAppI18n } from '@webonone/i18n'

import enShell from '@locales/webonone/en/shell.json'
import enHome from '@locales/webonone/en/home.json'
import enSettings from '@locales/webonone/en/settings.json'
import enStaff from '@locales/webonone/en/staff.json'
import enCalendar from '@locales/webonone/en/calendar.json'
import enCatalog from '@locales/webonone/en/catalog.json'
import enSales from '@locales/webonone/en/sales.json'
import enAnalytics from '@locales/webonone/en/analytics.json'
import enSession from '@locales/webonone/en/session.json'
import siShell from '@locales/webonone/si/shell.json'
import siHome from '@locales/webonone/si/home.json'
import siSettings from '@locales/webonone/si/settings.json'
import siStaff from '@locales/webonone/si/staff.json'
import siCalendar from '@locales/webonone/si/calendar.json'
import siCatalog from '@locales/webonone/si/catalog.json'
import siSales from '@locales/webonone/si/sales.json'
import siAnalytics from '@locales/webonone/si/analytics.json'
import siSession from '@locales/webonone/si/session.json'

import enAuth from '@locales/identity/en/auth.json'
import enProfile from '@locales/identity/en/profile.json'
import enUsers from '@locales/identity/en/users.json'
import siAuth from '@locales/identity/si/auth.json'
import siProfile from '@locales/identity/si/profile.json'
import siUsers from '@locales/identity/si/users.json'

import enTags from '@locales/data/en/tags.json'
import enProducts from '@locales/data/en/products.json'
import enServices from '@locales/data/en/services.json'
import enSpaces from '@locales/data/en/spaces.json'
import enUnits from '@locales/data/en/units.json'
import enAttributes from '@locales/data/en/attributes.json'
import siTags from '@locales/data/si/tags.json'
import siProducts from '@locales/data/si/products.json'
import siServices from '@locales/data/si/services.json'
import siSpaces from '@locales/data/si/spaces.json'
import siUnits from '@locales/data/si/units.json'
import siAttributes from '@locales/data/si/attributes.json'

import enSmsShell from '@locales/sms/en/shell.json'
import enSmsTemplates from '@locales/sms/en/templates.json'
import enSmsQueue from '@locales/sms/en/queue.json'
import enSmsSend from '@locales/sms/en/send.json'
import enDevices from '@locales/sms/en/devices.json'
import enGateway from '@locales/sms/en/gateway.json'
import siSmsShell from '@locales/sms/si/shell.json'
import siSmsTemplates from '@locales/sms/si/templates.json'
import siSmsQueue from '@locales/sms/si/queue.json'
import siSmsSend from '@locales/sms/si/send.json'
import siDevices from '@locales/sms/si/devices.json'
import siGateway from '@locales/sms/si/gateway.json'

import enEmailShell from '@locales/email/en/shell.json'
import enEmailTemplates from '@locales/email/en/templates.json'
import enEmailQueue from '@locales/email/en/queue.json'
import enEmailSend from '@locales/email/en/send.json'
import siEmailShell from '@locales/email/si/shell.json'
import siEmailTemplates from '@locales/email/si/templates.json'
import siEmailQueue from '@locales/email/si/queue.json'
import siEmailSend from '@locales/email/si/send.json'

import enInvoices from '@locales/payment/en/invoices.json'
import siInvoices from '@locales/payment/si/invoices.json'

import enForms from '@locales/design/en/forms.json'
import enWebsite from '@locales/design/en/website.json'
import siForms from '@locales/design/si/forms.json'
import siWebsite from '@locales/design/si/website.json'

export const MOBILE_NAMESPACES = [
  'shell',
  'home',
  'settings',
  'staff',
  'calendar',
  'catalog',
  'sales',
  'analytics',
  'session',
  'auth',
  'profile',
  'users',
  'tags',
  'products',
  'services',
  'spaces',
  'units',
  'attributes',
  'smsShell',
  'smsTemplates',
  'smsQueue',
  'smsSend',
  'devices',
  'gateway',
  'emailShell',
  'emailTemplates',
  'emailQueue',
  'emailSend',
  'invoices',
  'forms',
  'website',
] as const

/** Load the same en/si JSON packs the web apps use. Call once before render. */
export function initMobileI18n() {
  return createAppI18n({
    applyQueryParams: false,
    ns: [...MOBILE_NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        home: enHome,
        settings: enSettings,
        staff: enStaff,
        calendar: enCalendar,
        catalog: enCatalog,
        sales: enSales,
        analytics: enAnalytics,
        session: enSession,
        auth: enAuth,
        profile: enProfile,
        users: enUsers,
        tags: enTags,
        products: enProducts,
        services: enServices,
        spaces: enSpaces,
        units: enUnits,
        attributes: enAttributes,
        smsShell: enSmsShell,
        smsTemplates: enSmsTemplates,
        smsQueue: enSmsQueue,
        smsSend: enSmsSend,
        devices: enDevices,
        gateway: enGateway,
        emailShell: enEmailShell,
        emailTemplates: enEmailTemplates,
        emailQueue: enEmailQueue,
        emailSend: enEmailSend,
        invoices: enInvoices,
        forms: enForms,
        website: enWebsite,
      },
      si: {
        shell: siShell,
        home: siHome,
        settings: siSettings,
        staff: siStaff,
        calendar: siCalendar,
        catalog: siCatalog,
        sales: siSales,
        analytics: siAnalytics,
        session: siSession,
        auth: siAuth,
        profile: siProfile,
        users: siUsers,
        tags: siTags,
        products: siProducts,
        services: siServices,
        spaces: siSpaces,
        units: siUnits,
        attributes: siAttributes,
        smsShell: siSmsShell,
        smsTemplates: siSmsTemplates,
        smsQueue: siSmsQueue,
        smsSend: siSmsSend,
        devices: siDevices,
        gateway: siGateway,
        emailShell: siEmailShell,
        emailTemplates: siEmailTemplates,
        emailQueue: siEmailQueue,
        emailSend: siEmailSend,
        invoices: siInvoices,
        forms: siForms,
        website: siWebsite,
      },
    },
  })
}

export { getAppI18n }
