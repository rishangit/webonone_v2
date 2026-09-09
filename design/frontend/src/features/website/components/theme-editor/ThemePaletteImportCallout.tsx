import { ClipboardPaste } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Callout, CalloutAction, CalloutDescription, CalloutTitle } from '@webonone/ui-kit'

export function ThemePaletteImportCallout({
  disabled,
  onOpenImport,
}: {
  disabled?: boolean
  onOpenImport: () => void
}) {
  const { t } = useTranslation('website')

  return (
    <Callout>
      <CalloutTitle>{t('importFromCColorPalette')}</CalloutTitle>
      <CalloutDescription>
        <Trans
          ns="website"
          i18nKey="importPaletteCallout"
          components={{
            site: (
              <a
                href="https://ccolorpalette.com/"
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
        <Button type="button" className="h-10" onClick={onOpenImport} disabled={disabled}>
          <ClipboardPaste className="mr-2 h-4 w-4" />
          {t('pasteCssFromCColorPalette')}
        </Button>
      </CalloutAction>
    </Callout>
  )
}
