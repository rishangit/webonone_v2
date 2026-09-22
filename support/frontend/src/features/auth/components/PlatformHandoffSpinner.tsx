import { LoadingState } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'

export function PlatformHandoffSpinner() {
  const { t } = useTranslation('common')
  return <LoadingState overlay label={t('loading')} />
}
