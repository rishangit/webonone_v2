import { useState } from 'react'
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
  title = 'Login required',
  description = 'You need to log in to continue. After login you will return to this page.',
}: LoginRequiredDialogProps) {
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
      title={title}
      description={description}
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
            Cancel
          </Button>
          <Button type="button" disabled={redirecting} onClick={handleLogin}>
            <LogIn className="mr-2 h-4 w-4" aria-hidden />
            {redirecting ? 'Continuing to login…' : 'Login'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Sign in with your WebOnOne account to book a queue token and use signed-in features.
      </p>
    </CustomDialog>
  )
}
