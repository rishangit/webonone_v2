import { ExternalLink } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Callout, CalloutAction, CalloutDescription, CalloutTitle } from '@webonone/ui-kit'
import { GOOGLE_FONTS_ORIGIN } from '../../utils/googleFontsConfig'

export function ThemeFontsGuideCallout() {
  const { t } = useTranslation('website')

  return (
    <Callout>
      <CalloutTitle>{t('addGoogleFontGuideTitle')}</CalloutTitle>
      <CalloutDescription>
        <Trans
          ns="website"
          i18nKey="addGoogleFontGuide"
          components={{
            site: (
              <a
                href={GOOGLE_FONTS_ORIGIN}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              />
            ),
            b: <span className="font-medium text-foreground" />,
            code: <code className="rounded bg-background/80 px-1 py-0.5 text-xs" />,
          }}
        />
      </CalloutDescription>
      <CalloutAction>
        <Button type="button" variant="outline" className="h-10" asChild>
          <a href={GOOGLE_FONTS_ORIGIN} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('openGoogleFonts')}
          </a>
        </Button>
      </CalloutAction>
    </Callout>
  )
}
