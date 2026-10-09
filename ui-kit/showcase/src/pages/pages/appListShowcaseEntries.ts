export type ShowcaseService =
  | 'data'
  | 'identity'
  | 'webonone'
  | 'email'
  | 'sms'
  | 'design'
  | 'payment'
  | 'ai'
  | 'media'

export type AppListRowVariant =
  | 'data-catalog'
  | 'data-tag'
  | 'data-unit'
  | 'data-attribute'
  | 'data-tag-picker'
  | 'identity-user'
  | 'identity-user-picker'
  | 'webonone-staff'
  | 'webonone-staff-leave'
  | 'webonone-sales-history'
  | 'webonone-pos-cart'
  | 'webonone-company-catalog'
  | 'webonone-calendar-event'
  | 'webonone-calendar-session'
  | 'webonone-theme'
  | 'webonone-companies'
  | 'webonone-my-companies'
  | 'webonone-notifications'
  | 'webonone-dashboard-event'
  | 'email-template'
  | 'email-history'
  | 'email-queue'
  | 'sms-template'
  | 'sms-history'
  | 'sms-queue'
  | 'sms-device'
  | 'design-form'
  | 'design-website-page'
  | 'payment-invoice'
  | 'ai-conversation'
  | 'media-folder'
  | 'media-file'

export type AppListShowcaseEntry = {
  id: string
  /** Breadcrumb shown above the row, e.g. Data › Products */
  source: string
  /** Owning list component in the monorepo */
  component: string
  service: ShowcaseService
  variant: AppListRowVariant
}

export const APP_LIST_SHOWCASE_ENTRIES: AppListShowcaseEntry[] = [
  {
    id: 'data-products',
    source: 'Data › Products',
    component: 'data/…/CatalogList.tsx',
    service: 'data',
    variant: 'data-catalog',
  },
  {
    id: 'data-services',
    source: 'Data › Services',
    component: 'data/…/CatalogList.tsx',
    service: 'data',
    variant: 'data-catalog',
  },
  {
    id: 'data-spaces',
    source: 'Data › Spaces',
    component: 'data/…/CatalogList.tsx',
    service: 'data',
    variant: 'data-catalog',
  },
  {
    id: 'data-tags',
    source: 'Data › Tags',
    component: 'data/…/TagsList.tsx',
    service: 'data',
    variant: 'data-tag',
  },
  {
    id: 'data-units',
    source: 'Data › Units',
    component: 'data/…/UnitsList.tsx',
    service: 'data',
    variant: 'data-unit',
  },
  {
    id: 'data-attributes',
    source: 'Data › Attributes',
    component: 'data/…/AttributesList.tsx',
    service: 'data',
    variant: 'data-attribute',
  },
  {
    id: 'data-tag-picker',
    source: 'Data › Tag picker (dialog)',
    component: 'data/…/TagPickerPanel.tsx',
    service: 'data',
    variant: 'data-tag-picker',
  },
  {
    id: 'identity-users',
    source: 'Identity › Users',
    component: 'identity/…/UsersPage.tsx',
    service: 'identity',
    variant: 'identity-user',
  },
  {
    id: 'identity-user-picker',
    source: 'Identity › User picker',
    component: 'identity/…/UserPickerPage.tsx',
    service: 'identity',
    variant: 'identity-user-picker',
  },
  {
    id: 'webonone-staff',
    source: 'WebOnOne › Staff',
    component: 'webonone-v2/…/StaffList.tsx',
    service: 'webonone',
    variant: 'webonone-staff',
  },
  {
    id: 'webonone-staff-leaves',
    source: 'WebOnOne › Staff › Leave requests',
    component: 'webonone-v2/…/StaffLeavesList.tsx',
    service: 'webonone',
    variant: 'webonone-staff-leave',
  },
  {
    id: 'webonone-sales-history',
    source: 'WebOnOne › Sales › History',
    component: 'webonone-v2/…/SalesList.tsx',
    service: 'webonone',
    variant: 'webonone-sales-history',
  },
  {
    id: 'webonone-pos-cart',
    source: 'WebOnOne › Sales › POS cart',
    component: 'webonone-v2/…/PosCartList.tsx',
    service: 'webonone',
    variant: 'webonone-pos-cart',
  },
  {
    id: 'webonone-catalog-products',
    source: 'WebOnOne › Company catalog › Products',
    component: 'webonone-v2/…/CompanyCatalogListPage.tsx',
    service: 'webonone',
    variant: 'webonone-company-catalog',
  },
  {
    id: 'webonone-catalog-services',
    source: 'WebOnOne › Company catalog › Services',
    component: 'webonone-v2/…/CompanyCatalogListPage.tsx',
    service: 'webonone',
    variant: 'webonone-company-catalog',
  },
  {
    id: 'webonone-calendar-events',
    source: 'WebOnOne › Calendar › Events',
    component: 'webonone-v2/…/EventsList.tsx',
    service: 'webonone',
    variant: 'webonone-calendar-event',
  },
  {
    id: 'webonone-calendar-sessions',
    source: 'WebOnOne › Calendar › Event sessions',
    component: 'webonone-v2/…/EventSessionsList.tsx',
    service: 'webonone',
    variant: 'webonone-calendar-session',
  },
  {
    id: 'webonone-home-events',
    source: 'WebOnOne › Home › Upcoming sessions',
    component: 'webonone-v2/…/DashboardEventList.tsx',
    service: 'webonone',
    variant: 'webonone-dashboard-event',
  },
  {
    id: 'webonone-themes',
    source: 'WebOnOne › Settings › System theme',
    component: 'webonone-v2/…/ThemeList.tsx',
    service: 'webonone',
    variant: 'webonone-theme',
  },
  {
    id: 'webonone-companies',
    source: 'WebOnOne › Settings › Companies (admin)',
    component: 'webonone-v2/…/CompaniesList.tsx',
    service: 'webonone',
    variant: 'webonone-companies',
  },
  {
    id: 'webonone-my-companies',
    source: 'WebOnOne › Settings › My companies',
    component: 'webonone-v2/…/MyCompaniesList.tsx',
    service: 'webonone',
    variant: 'webonone-my-companies',
  },
  {
    id: 'webonone-notifications',
    source: 'WebOnOne › Notifications',
    component: 'webonone-v2/…/NotificationsList.tsx',
    service: 'webonone',
    variant: 'webonone-notifications',
  },
  {
    id: 'email-templates',
    source: 'Email › Templates',
    component: 'email/…/TemplatesList.tsx',
    service: 'email',
    variant: 'email-template',
  },
  {
    id: 'email-history',
    source: 'Email › History',
    component: 'email/…/HistoryList.tsx',
    service: 'email',
    variant: 'email-history',
  },
  {
    id: 'email-queue',
    source: 'Email › Queue',
    component: 'email/…/QueueList.tsx',
    service: 'email',
    variant: 'email-queue',
  },
  {
    id: 'sms-templates',
    source: 'SMS › Templates',
    component: 'sms/…/TemplatesList.tsx',
    service: 'sms',
    variant: 'sms-template',
  },
  {
    id: 'sms-history',
    source: 'SMS › History',
    component: 'sms/…/HistoryList.tsx',
    service: 'sms',
    variant: 'sms-history',
  },
  {
    id: 'sms-queue',
    source: 'SMS › Queue',
    component: 'sms/…/QueueList.tsx',
    service: 'sms',
    variant: 'sms-queue',
  },
  {
    id: 'sms-devices',
    source: 'SMS › Devices',
    component: 'sms/…/DevicesList.tsx',
    service: 'sms',
    variant: 'sms-device',
  },
  {
    id: 'design-forms',
    source: 'Design › Forms',
    component: 'design/…/FormsList.tsx',
    service: 'design',
    variant: 'design-form',
  },
  {
    id: 'design-website-pages',
    source: 'Design › Website › Pages',
    component: 'design/…/WebsitePagesList.tsx',
    service: 'design',
    variant: 'design-website-page',
  },
  {
    id: 'payment-invoices',
    source: 'Payment › Invoices',
    component: 'payment/…/InvoicesPage.tsx',
    service: 'payment',
    variant: 'payment-invoice',
  },
  {
    id: 'ai-conversations',
    source: 'AI › Conversations',
    component: 'ai/…/ConversationsPage.tsx',
    service: 'ai',
    variant: 'ai-conversation',
  },
  {
    id: 'media-folder',
    source: 'Media › Library › Folders (list view)',
    component: 'media/…/ScopedFolderBrowser.tsx',
    service: 'media',
    variant: 'media-folder',
  },
  {
    id: 'media-file',
    source: 'Media › Library › Files (list view)',
    component: 'media/…/ScopedFolderBrowser.tsx',
    service: 'media',
    variant: 'media-file',
  },
]

/** @deprecated Use APP_LIST_SHOWCASE_ENTRIES — kept for imports that expect the old name */
export const SHOWCASE_LIST_ITEMS = APP_LIST_SHOWCASE_ENTRIES

export type ShowcaseListItem = AppListShowcaseEntry
