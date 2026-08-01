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
      title="Allow location access?"
      description="We use your location to sort search results by distance and show how far each offering is from you."
      sizeWidth="auto"
      sizeHeight="auto"
      maxWidth="max-w-md"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onNotNow}>
            Not now
          </Button>
          <Button
            type="button"
            onClick={handleAllow}
          >
            Allow location
          </Button>
        </div>
      }
    >
      {blocked ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Location is currently <span className="font-medium text-foreground">blocked</span> for
            this site. Unlock it first, then click Allow location:
          </p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Click the lock (or tune) icon next to the address bar</li>
            <li>
              Open <span className="font-medium text-foreground">Site settings</span>
            </li>
            <li>
              Set <span className="font-medium text-foreground">Location</span> to{' '}
              <span className="font-medium text-foreground">Allow</span>
            </li>
            <li>Return here and click Allow location</li>
          </ol>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Clicking <span className="font-medium text-foreground">Allow location</span> opens your
          browser’s permission popup. Choose{' '}
          <span className="font-medium text-foreground">Allow</span> there to share your precise
          location.
        </p>
      )}
    </CustomDialog>
  )
}
