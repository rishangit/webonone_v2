import type { TFunction } from 'i18next'

export function formatCatalogDistanceKm(
  distanceKm: number,
  t: TFunction<'home'> | TFunction<'search'>,
): string {
  if (distanceKm < 1) {
    return t('metersAway', { meters: String(Math.round(distanceKm * 1000)) })
  }
  return t('kmAway', { km: distanceKm.toFixed(1) })
}
