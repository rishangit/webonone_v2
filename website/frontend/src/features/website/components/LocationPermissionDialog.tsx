import { useTranslation } from 'react-i18next'
import { useRef } from 'react'
import { Button, CustomDialog } from '@webonone/ui-kit'

type LocationPermissionDialogProps = {
  open: boolean
  /** Browser already blocked this site — show unlock steps. */
  blocked?: boolean
  onAllow: () => void
  onNotNow: () => void
}

/**
 * In-app prompt. The browser’s native Allow/Block popup only appears after a
 * user gesture calls geolocation — and only if the site is not already blocked.
 *
 * Important: closing the dialog must NOT run onNotNow when the user clicked Allow,
 * or React/Radix teardown cancels the browser permission prompt.
 */
export function LocationPermissionDialog({
  open,
  blocked = false,
  onAllow,
  onNotNow,
}: LocationPermissionDialogProps) {
  const { t } = useTranslation('shell')
  const allowClickedRef = useRef(false)

  function handleAllow() {
    allowClickedRef.current = true
    // Call geolocation while still inside the user-gesture stack (before dialog close).
    onAllow()
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (next) return
        if (allowClickedRef.current) {
          allowClickedRef.current = false
          return
        }
        onNotNow()
      }}
      title={t('locationPromptTitle')}
      description={t('locationPromptBody')}
      sizeWidth="auto"
      sizeHeight="auto"
      maxWidth="max-w-md"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onNotNow}>
            {t('locationNotNow')}
          </Button>
          <Button
            type="button"
            onClick={handleAllow}
          >
            {t('locationAllow')}
          </Button>
        </div>
      }
    >
      {blocked ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{t('locationBlockedIntro')}</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>{t('locationUnlockStep1')}</li>
            <li>{t('locationUnlockStep2')}</li>
            <li>{t('locationUnlockStep3')}</li>
            <li>{t('locationUnlockStep4')}</li>
          </ol>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('locationAllowBrowserHint')}</p>
      )}
    </CustomDialog>
  )
}
