export type CatalogPriceSchedule = 'all_time' | 'selected_days'
export type CatalogPriceAudience = 'everyone' | 'selected_users'

export type CatalogPriceRuleUser = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
}

export type CatalogPriceRule = {
  id: string
  price: number
  applyWhen: CatalogPriceSchedule
  weekdays: number[]
  startTime: string | null
  endTime: string | null
  applyTo: CatalogPriceAudience
  users: CatalogPriceRuleUser[]
  createdAt: string
}

export type CatalogPriceKind = 'services' | 'spaces'
