import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogIn } from 'lucide-react'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { getWebsiteLoginHref } from '@/features/auth/utils/identityConfig'

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

export type LoginRequiredDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Path (+ optional search) to return to after login, e.g. `/catalog/services/abc`. */
  returnPath: string
  title?: string
  description?: string
}

/**
 * Confirms that the guest must log in before a protected action, then starts
 * website `/login` (Identity iframe on this origin).
 */
export function LoginRequiredDialog({
  open,
  onOpenChange,
  returnPath,
  title,
  description,
}: LoginRequiredDialogProps) {
  const { t } = useTranslation('auth')
  const { t: tc } = useTranslation('common')
  const [redirecting, setRedirecting] = useState(false)

  function handleOpenChange(next: boolean) {
    if (redirecting) return
    onOpenChange(next)
    if (!next) {
      setRedirecting(false)
    }
  }

  function handleLogin() {
    setRedirecting(true)
    window.location.assign(getWebsiteLoginHref(returnPath))
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title ?? t('loginRequiredTitle')}
      description={description ?? t('loginRequiredBody')}
      sizeWidth="small"
      sizeHeight="auto"
      maxWidth="max-w-md"
      hideCloseButton={redirecting}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className={OUTLINE_FOOTER}
            disabled={redirecting}
            onClick={() => handleOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" disabled={redirecting} onClick={handleLogin}>
            <LogIn className="mr-2 h-4 w-4" aria-hidden />
            {redirecting ? t('continuingToLogin') : t('login')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{t('loginRequiredHint')}</p>
    </CustomDialog>
  )
}
