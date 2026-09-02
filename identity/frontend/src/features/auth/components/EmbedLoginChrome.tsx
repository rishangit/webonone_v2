import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EmbedAuthLink } from './EmbedAuthLink'

type EmbedLoginChromeProps = {
  registerLink: string
  children: ReactNode
}

export function EmbedLoginChrome({ registerLink, children }: EmbedLoginChromeProps) {
  const { t } = useTranslation('auth')
  const year = new Date().getFullYear()

  return (
    <div className="flex w-full flex-col">
      <h1 className="px-4 pt-6 text-center text-2xl font-semibold tracking-tight text-title sm:px-0 sm:pt-8">
        {t('welcomeBack')}
      </h1>
      <div className="mt-6">{children}</div>
      <div className="mt-6 flex flex-col items-center gap-2 px-4 pb-6 text-center text-sm text-muted-foreground sm:px-0">
        <p>
          {t('noAccount')}{' '}
          <EmbedAuthLink to={registerLink} className="text-primary underline-offset-4 hover:underline">
            {t('signUp')}
          </EmbedAuthLink>
        </p>
        <p>{t('copyright', { year })}</p>
      </div>
    </div>
  )
}
