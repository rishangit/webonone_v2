import type { CatalogDiscount, CatalogPrice } from '@/features/company-catalog/types/catalogPricing.types'
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'

const DAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const

type Translate = (key: string, options?: Record<string, unknown>) => string

export function formatPercentLabel(percent: number): string {
  return String(Math.round(percent * 100) / 100)
}

export function formatCatalogDiscountWhen(
  discount: CatalogDiscount,
  t: Translate,
  language: string,
): string {
  if (discount.applyWhen === 'all_time') return t('priceList.allTime')
  if (discount.applyWhen === 'selected_days') {
    return discount.weekdays.map((day) => t(`priceList.days.${DAY_KEYS[day] ?? day}`)).join(', ')
  }
  if (discount.startDate && discount.endDate) {
    return `${formatCalendarYmd(discount.startDate, language)} – ${formatCalendarYmd(discount.endDate, language)}`
  }
  return t('priceList.selectedRange')
}

export function formatCatalogDiscountWhom(discount: CatalogDiscount, t: Translate): string {
  if (discount.applyTo === 'everyone') return t('priceList.everyone')
  if (discount.users.length === 0) return t('priceList.selectedUsers')
  return discount.users.map((user) => user.displayName).join(', ')
}

function localDateYmd(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function discountMatches(discount: CatalogDiscount, userId: string | null | undefined, now: Date): boolean {
  const audienceOk =
    discount.applyTo === 'everyone' ||
    (Boolean(userId) && discount.users.some((user) => user.id === userId))
  if (!audienceOk) return false
  if (discount.applyWhen === 'all_time') return true
  if (discount.applyWhen === 'selected_days') return discount.weekdays.includes(now.getDay())
  if (!discount.startDate || !discount.endDate) return false
  const today = localDateYmd(now)
  return today >= discount.startDate && today <= discount.endDate
}

function specificity(discount: CatalogDiscount): number {
  return (
    (discount.applyVariants === 'selected' ? 8 : 0) +
    (discount.applyTo === 'selected_users' ? 4 : 0) +
    (discount.applyWhen === 'date_range' ? 2 : 0) +
    (discount.applyWhen === 'selected_days' ? 1 : 0)
  )
}

export function resolveApplicableVariantDiscount(
  discounts: CatalogDiscount[],
  variantId: string,
  userId: string | null | undefined,
  now: Date = new Date(),
): CatalogDiscount | null {
  const matches = discounts.filter(
    (discount) =>
      (discount.applyVariants === 'all' ||
        discount.variants.some((variant) => variant.id === variantId)) &&
      discountMatches(discount, userId, now),
  )
  if (matches.length === 0) return null
  matches.sort((a, b) => {
    const score = specificity(b) - specificity(a)
    if (score !== 0) return score
    return b.createdAt.localeCompare(a.createdAt)
  })
  return matches[0] ?? null
}

export function applyDiscountPercent(price: number, percent: number): number {
  const cents = Math.round(price * 100)
  const discounted = Math.round((cents * (100 - percent)) / 100)
  return discounted / 100
}

export type ApplicableCatalogOffer = {
  basePrice: number
  price: number
  discount: CatalogDiscount | null
}

/** Active price after the discount that matches this viewer today. */
export function resolveApplicableCatalogOffer(
  prices: CatalogPrice[],
  discounts: CatalogDiscount[],
  userId: string | null | undefined,
  now: Date = new Date(),
): ApplicableCatalogOffer | null {
  const active = prices.find((item) => item.isActive)
  if (!active) return null
  const matches = discounts.filter((discount) => discountMatches(discount, userId, now))
  matches.sort((a, b) => {
    const score = specificity(b) - specificity(a)
    if (score !== 0) return score
    return b.createdAt.localeCompare(a.createdAt)
  })
  const discount = matches[0] ?? null
  return {
    basePrice: active.price,
    price: discount ? applyDiscountPercent(active.price, discount.percent) : active.price,
    discount,
  }
}
