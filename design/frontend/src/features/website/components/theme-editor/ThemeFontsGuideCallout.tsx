import { useTranslation } from 'react-i18next'
import { Callout, CalloutDescription, CalloutTitle } from '@webonone/ui-kit'

export function ThemeFontsGuideCallout() {
  const { t } = useTranslation('website')

  return (
    <Callout>
      <CalloutTitle>{t('addGoogleFontGuideTitle')}</CalloutTitle>
      <CalloutDescription>{t('addGoogleFontGuide')}</CalloutDescription>
    </Callout>
  )
}
