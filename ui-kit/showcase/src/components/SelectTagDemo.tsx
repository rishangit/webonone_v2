import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  SelectTag,
  type SelectTagValue,
} from '@webonone/ui-kit'
import {
  DataTagCreateFrame,
  DataTagPickerFrame,
  sendDataTagPickerCreateSubmit,
  sendDataTagPickerSetSelection,
  type DataTagPickerMode,
  type DataTagPickerTag,
} from '@webonone/platform-embed'
import { DemoSection } from '@/components/DemoSection'
import { getDataOrigin } from '@/features/auth/showcaseAuth'
import { normalizeOrigin, useOriginReachable } from '@/hooks/useOriginReachable'
import { useShowcaseAccessToken } from '@/hooks/useShowcaseAccessToken'

const DEMO_SELECTED_TAG: SelectTagValue = {
  id: 'demo-tag-1',
  name: 'Featured',
  color: '#3366FF',
}

const DEMO_SELECTED_TAGS: SelectTagValue[] = [
  DEMO_SELECTED_TAG,
  { id: 'demo-tag-2', name: 'New Arrival', color: '#16A34A' },
  { id: 'demo-tag-3', name: 'Sale', color: '#DC2626' },
  { id: 'demo-tag-4', name: 'Limited', color: '#D97706' },
  { id: 'demo-tag-5', name: 'Seasonal', color: '#7C3AED' },
]

type DataTagPickerFieldProps = {
  scope: string
  multiple?: boolean
  label: string
  dataOrigin: string
  accessToken: string
}

function DataTagPickerField({
  scope,
  multiple = false,
  label,
  dataOrigin,
  accessToken,
}: DataTagPickerFieldProps) {
  const pickerMode: DataTagPickerMode = multiple ? 'multiple' : 'single'
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerAttempt, setPickerAttempt] = useState(0)
  const [selectedTags, setSelectedTags] = useState<SelectTagValue[]>([])
  const [pendingSelection, setPendingSelection] = useState<DataTagPickerTag[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createAttempt, setCreateAttempt] = useState(0)
  const pickerIframeRef = useRef<HTMLIFrameElement>(null)
  const createIframeRef = useRef<HTMLIFrameElement>(null)

  const canOpen = dataOrigin.length > 0
  const primaryTag = selectedTags[0] ?? null

  function openPicker() {
    if (!canOpen) {
      return
    }
    setPendingSelection(selectedTags)
    setPickerOpen(true)
    setPickerAttempt((attempt) => attempt + 1)
  }

  function handleDialogOpenChange(open: boolean) {
    setPickerOpen(open)
    if (!open) {
      setPendingSelection([])
      setCreateOpen(false)
    }
  }

  function handleDone() {
    setSelectedTags(pendingSelection)
    setPickerOpen(false)
  }

  function openCreateDialog() {
    setCreateOpen(true)
    setCreateAttempt((attempt) => attempt + 1)
  }

  function handleCreateSubmit() {
    const iframe = createIframeRef.current
    if (!iframe) {
      return
    }
    sendDataTagPickerCreateSubmit(iframe, dataOrigin, scope)
  }

  function handleCreated(tag: DataTagPickerTag) {
    const nextPending = multiple
      ? pendingSelection.some((entry) => entry.id === tag.id)
        ? pendingSelection
        : [...pendingSelection, tag]
      : [tag]

    setPendingSelection(nextPending)
    const iframe = pickerIframeRef.current
    if (iframe) {
      sendDataTagPickerSetSelection(iframe, dataOrigin, scope, nextPending)
    }
    setCreateOpen(false)
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <SelectTag
          multiple={multiple}
          selectedTag={multiple ? undefined : primaryTag}
          selectedTags={multiple ? selectedTags : undefined}
          placeholder={multiple ? 'Choose tags' : 'Choose a tag'}
          onClick={openPicker}
          disabled={!canOpen}
          aria-label={`Open Data tag picker (${label})`}
        />
      </div>

      <CustomDialog
        open={pickerOpen}
        onOpenChange={handleDialogOpenChange}
        title="Select tags"
        description={
          multiple ? 'Choose one or more tags, then click Done.' : 'Choose a tag, then click Done.'
        }
        sizeWidth="small"
        sizeHeight="large"
        noContentPadding
        disableContentScroll
        nestedDismissGuard={createOpen}
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
        <div className="flex h-full min-h-0 flex-col">
          {canOpen ? (
            <DataTagPickerFrame
              key={`${pickerAttempt}-${accessToken ? 'authed' : 'guest'}`}
              ref={pickerIframeRef}
              isOpen={pickerOpen}
              accessToken={accessToken || null}
              dataOrigin={dataOrigin}
              parentOrigin={window.location.origin}
              scope={scope}
              mode={pickerMode}
              selectedTags={selectedTags}
              className="block h-full min-h-0 w-full border-0 bg-transparent"
              onSelectionChange={setPendingSelection}
              onCreateRequest={openCreateDialog}
              onCancel={() => setPickerOpen(false)}
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-sm text-muted-foreground">
              Configure a valid `VITE_DATA_ORIGIN` before opening the picker.
            </div>
          )}
        </div>
      </CustomDialog>

      <CustomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add new tag"
        description="Create a tag, then it is selected in the picker automatically."
        sizeWidth="medium"
        sizeHeight="large"
        noContentPadding
        disableContentScroll
        stackLevel={1}
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" className="h-10 px-4" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="h-10 px-4" onClick={handleCreateSubmit}>
              Create
            </Button>
          </div>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <DataTagCreateFrame
            key={`${createAttempt}-${accessToken ? 'authed' : 'guest'}`}
            ref={createIframeRef}
            isOpen={createOpen}
            accessToken={accessToken || null}
            dataOrigin={dataOrigin}
            parentOrigin={window.location.origin}
            scope={scope}
            className="block h-full min-h-0 w-full border-0 bg-transparent"
            onCreated={handleCreated}
            onCancel={() => setCreateOpen(false)}
          />
        </div>
      </CustomDialog>
    </>
  )
}

export function SelectTagControlsDemo() {
  const { accessToken } = useShowcaseAccessToken()
  const dataOriginNormalized = useMemo(() => normalizeOrigin(getDataOrigin()), [])
  const dataReachable = useOriginReachable(dataOriginNormalized)

  return (
    <DemoSection
      id="select-tag"
      title="Select tags"
      description="Data-hosted tag picker for single or multi-select. Choose tags, add new ones in a stacked dialog, then click Done."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Placeholder</p>
            <SelectTag placeholder="Choose a tag" onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected (single)</p>
            <SelectTag selectedTag={DEMO_SELECTED_TAG} onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected (multi stack)</p>
            <SelectTag multiple selectedTags={DEMO_SELECTED_TAGS} onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Disabled</p>
            <SelectTag placeholder="Choose a tag" disabled />
          </div>
        </div>

        <div className="grid gap-4 border-t pt-6 sm:grid-cols-2">
          <DataTagPickerField
            scope="showcase:complex-controls:tag-picker-single"
            label="Single-select (live)"
            dataOrigin={dataOriginNormalized}
            accessToken={accessToken}
          />
          <DataTagPickerField
            scope="showcase:complex-controls:tag-picker-multiple"
            multiple
            label="Multi-select (live)"
            dataOrigin={dataOriginNormalized}
            accessToken={accessToken}
          />
        </div>

        {dataReachable === false ? (
          <Alert variant="destructive">
            <AlertDescription>
              Cannot reach Data frontend at {dataOriginNormalized}. Start Data with `npm run dev:data`
              (port 3015).
            </AlertDescription>
          </Alert>
        ) : null}
        {!dataOriginNormalized ? (
          <Alert variant="destructive">
            <AlertDescription>
              `VITE_DATA_ORIGIN` is invalid. Set it to a valid Data origin (for example
              `http://127.0.0.1:3015`).
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </DemoSection>
  )
}
