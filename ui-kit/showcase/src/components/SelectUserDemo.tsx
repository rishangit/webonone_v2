import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  SelectUser,
  type SelectUserValue,
} from '@webonone/ui-kit'
import {
  buildIdentityUserPickerUrl,
  IdentityUserPickerFrame,
  type IdentityUserPickerMode,
  type IdentityUserPickerUser,
} from '@webonone/platform-embed'
import { DemoSection } from '@/components/DemoSection'
import { getIdentityOrigin } from '@/features/auth/showcaseAuth'
import { normalizeOrigin, useOriginReachable } from '@/hooks/useOriginReachable'
import { useShowcaseAccessToken } from '@/hooks/useShowcaseAccessToken'

const USER_PICKER_LOAD_TIMEOUT_MS = 10000

const DEMO_SELECTED_USER: SelectUserValue = {
  id: 'demo-user-1',
  displayName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
}

const DEMO_SELECTED_USERS: SelectUserValue[] = [
  DEMO_SELECTED_USER,
  { id: 'demo-user-2', displayName: 'Jane Doe', email: 'jane.doe@example.com' },
  { id: 'demo-user-3', displayName: 'Sam Kim', email: 'sam.kim@example.com' },
  { id: 'demo-user-4', displayName: 'Riley Wong', email: 'riley.wong@example.com' },
  { id: 'demo-user-5', displayName: 'Taylor Chen', email: 'taylor.chen@example.com' },
  { id: 'demo-user-6', displayName: 'Morgan Jones', email: 'morgan.jones@example.com' },
]

type IdentityUserPickerFieldProps = {
  scope: string
  multiple?: boolean
  label: string
  identityPickerOrigin: string
  accessToken: string
  onReachabilityCheck: () => void
}

function IdentityUserPickerField({
  scope,
  multiple = false,
  label,
  identityPickerOrigin,
  accessToken,
  onReachabilityCheck,
}: IdentityUserPickerFieldProps) {
  const pickerMode: IdentityUserPickerMode = multiple ? 'multiple' : 'single'
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerAttempt, setPickerAttempt] = useState(0)
  const [selectedUsers, setSelectedUsers] = useState<IdentityUserPickerUser[]>([])
  const [pendingSelection, setPendingSelection] = useState<IdentityUserPickerUser[]>([])
  const [identityPickerStatus, setIdentityPickerStatus] = useState<
    'idle' | 'loading' | 'ready' | 'unavailable'
  >('idle')
  const loadSettledRef = useRef(false)

  const canOpenIdentityPicker = identityPickerOrigin.length > 0
  const primarySelectedUser = selectedUsers[0] ?? null

  const pickerEmbedUrl = useMemo(() => {
    if (!identityPickerOrigin || typeof window === 'undefined') {
      return ''
    }
    return buildIdentityUserPickerUrl({
      identityOrigin: identityPickerOrigin,
      parentOrigin: window.location.origin,
      scope,
      mode: pickerMode,
    })
  }, [identityPickerOrigin, pickerMode, scope])

  async function openPicker() {
    if (!identityPickerOrigin) {
      return
    }

    loadSettledRef.current = false
    setPendingSelection(selectedUsers)
    onReachabilityCheck()

    try {
      const response = await fetch(`${identityPickerOrigin}/`, { method: 'GET' })
      if (!response.ok) {
        setIdentityPickerStatus('unavailable')
        setPickerOpen(true)
        return
      }
    } catch {
      setIdentityPickerStatus('unavailable')
      setPickerOpen(true)
      return
    }

    setIdentityPickerStatus('loading')
    setPickerOpen(true)
    setPickerAttempt((attempt) => attempt + 1)
  }

  function markPickerLoaded() {
    if (loadSettledRef.current) {
      return
    }
    loadSettledRef.current = true
    setIdentityPickerStatus('ready')
  }

  function handleDone() {
    if (pendingSelection.length === 0) {
      return
    }
    setSelectedUsers(pendingSelection)
    setPickerOpen(false)
  }

  function handleDialogOpenChange(open: boolean) {
    setPickerOpen(open)
    if (!open) {
      setPendingSelection([])
    }
  }

  useEffect(() => {
    if (!pickerOpen || !canOpenIdentityPicker || identityPickerStatus === 'unavailable') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (!loadSettledRef.current) {
        setIdentityPickerStatus('unavailable')
      }
    }, USER_PICKER_LOAD_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [pickerAttempt, pickerOpen, canOpenIdentityPicker, identityPickerStatus])

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <SelectUser
          multiple={multiple}
          selectedUser={multiple ? undefined : primarySelectedUser}
          selectedUsers={multiple ? selectedUsers : undefined}
          placeholder={multiple ? 'Choose users' : 'Choose a user'}
          onClick={openPicker}
          disabled={!canOpenIdentityPicker}
          aria-label={`Open Identity user picker (${label})`}
        />
      </div>

      <CustomDialog
        open={pickerOpen}
        onOpenChange={handleDialogOpenChange}
        title="Select user"
        description={
          multiple
            ? 'Choose one or more users, then click Done.'
            : 'Choose a user, then click Done.'
        }
        sizeWidth="large"
        sizeHeight="xlarge"
        noContentPadding
        disableContentScroll
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" className="h-10 px-4" onClick={() => setPickerOpen(false)}>
              Cancel
            </Button>
            <Button
              className="h-10 px-4"
              onClick={handleDone}
              disabled={pendingSelection.length === 0}
            >
              Done
              {pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
            </Button>
          </div>
        }
      >
        <div className="flex h-full min-h-0 flex-col p-4">
          {canOpenIdentityPicker && identityPickerStatus === 'unavailable' ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-destructive/40 px-4 text-center">
              <p className="font-medium">Identity user picker is unavailable.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Start Identity frontend with `npm run dev:identity` and confirm it is reachable at{' '}
                {identityPickerOrigin}.
              </p>
              {pickerEmbedUrl ? (
                <p className="max-w-md break-all text-xs text-muted-foreground">{pickerEmbedUrl}</p>
              ) : null}
              <Button variant="outline" onClick={() => void openPicker()}>
                Retry
              </Button>
            </div>
          ) : null}

          {canOpenIdentityPicker && identityPickerStatus !== 'unavailable' ? (
            <IdentityUserPickerFrame
              key={pickerAttempt}
              identityOrigin={identityPickerOrigin}
              scope={scope}
              mode={pickerMode}
              selectedUsers={selectedUsers}
              accessToken={accessToken || null}
              isOpen={pickerOpen}
              className="block h-full min-h-[420px] w-full rounded-md border border-border bg-background"
              onLoad={markPickerLoaded}
              onReady={markPickerLoaded}
              onError={() => setIdentityPickerStatus('unavailable')}
              onSelectionChange={setPendingSelection}
              onCancel={() => setPickerOpen(false)}
            />
          ) : null}
        </div>
      </CustomDialog>
    </>
  )
}

export function SelectUserControlsDemo() {
  const [reachabilityAttempt, setReachabilityAttempt] = useState(0)
  const { accessToken } = useShowcaseAccessToken()
  const identityPickerOrigin = useMemo(() => normalizeOrigin(getIdentityOrigin()), [])
  const identityReachable = useOriginReachable(identityPickerOrigin, reachabilityAttempt)

  return (
    <DemoSection
      id="select-user"
      title="Select user"
      description="Identity-hosted picker for single or multi-select. Choose in the list, then click Done."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Placeholder</p>
            <SelectUser placeholder="Choose a user" onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected (single)</p>
            <SelectUser selectedUser={DEMO_SELECTED_USER} onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected (multi stack)</p>
            <SelectUser
              multiple
              selectedUsers={DEMO_SELECTED_USERS}
              onClick={() => undefined}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Disabled</p>
            <SelectUser placeholder="Choose a user" disabled />
          </div>
        </div>

        <div className="grid gap-4 border-t pt-6 sm:grid-cols-2">
          <IdentityUserPickerField
            scope="showcase-complex-controls-user-picker-single"
            label="Single-select (live)"
            identityPickerOrigin={identityPickerOrigin}
            accessToken={accessToken}
            onReachabilityCheck={() => setReachabilityAttempt((n) => n + 1)}
          />
          <IdentityUserPickerField
            scope="showcase-complex-controls-user-picker-multiple"
            multiple
            label="Multi-select (live)"
            identityPickerOrigin={identityPickerOrigin}
            accessToken={accessToken}
            onReachabilityCheck={() => setReachabilityAttempt((n) => n + 1)}
          />
        </div>

        {identityReachable === false ? (
          <Alert variant="destructive">
            <AlertDescription>
              Cannot reach Identity frontend at {identityPickerOrigin}. Start the Identity UI with
              `npm run dev:identity` (port 3011).
            </AlertDescription>
          </Alert>
        ) : null}
        {!identityPickerOrigin ? (
          <Alert variant="destructive">
            <AlertDescription>
              `VITE_IDENTITY_ORIGIN` is invalid. Set it to a valid Identity origin (for example
              `http://127.0.0.1:3011`).
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </DemoSection>
  )
}
