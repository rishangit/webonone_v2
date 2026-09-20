import { useTranslation } from 'react-i18next'

export function useListCountSummary(loadedCount: number, totalCount: number): string {
  const { t } = useTranslation('common')
  return t('showingCount', { loaded: loadedCount, total: totalCount })
}
