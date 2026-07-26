import { useRef, useState } from 'react'
import {
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
  type DataTagPickerTag,
} from '@webonone/platform-embed'
import { useAppSelector } from '@/app/store/hooks'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import type { CompanyWizardFormValues } from '@/features/settings/basic/schemas/companySchemas'

interface CompanyWizardStepTagsProps {
  values: CompanyWizardFormValues
  isSubmitting: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
  onNestedOpenChange?: (open: boolean) => void
}

export function CompanyWizardStepTags({
  values,
  isSubmitting,
  onChange,
  onNestedOpenChange,
}: CompanyWizardStepTagsProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const dataOrigin = getDataOrigin().replace(/\/$/, '')
  const scope = 'webonone:company-wizard:tags'

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerAttempt, setPickerAttempt] = useState(0)
  const [pendingSelection, setPendingSelection] = useState<DataTagPickerTag[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createAttempt, setCreateAttempt] = useState(0)
  const pickerIframeRef = useRef<HTMLIFrameElement>(null)
  const createIframeRef = useRef<HTMLIFrameElement>(null)

  const canOpen = dataOrigin.length > 0 && Boolean(accessToken) && !isSubmitting
  const tags = values.tags as SelectTagValue[]

  function openPicker() {
    if (!canOpen) return
    setPendingSelection(values.tags)
    setPickerOpen(true)
    onNestedOpenChange?.(true)
    setPickerAttempt((attempt) => attempt + 1)
  }

  function handleDialogOpenChange(open: boolean) {
    setPickerOpen(open)
    if (!open) {
      setPendingSelection([])
      setCreateOpen(false)
      onNestedOpenChange?.(false)
    }
  }

  function handleDone() {
    onChange({
      tags: pendingSelection.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
    })
    setPickerOpen(false)
    onNestedOpenChange?.(false)
  }

  function openCreateDialog() {
    setCreateOpen(true)
    setCreateAttempt((attempt) => attempt + 1)
  }

  function handleCreateSubmit() {
    const iframe = createIframeRef.current
    if (!iframe) return
    sendDataTagPickerCreateSubmit(iframe, dataOrigin, scope)
  }

  function handleCreated(tag: DataTagPickerTag) {
    const nextPending = pendingSelection.some((entry) => entry.id === tag.id)
      ? pendingSelection
      : [...pendingSelection, tag]

    setPendingSelection(nextPending)
    const iframe = pickerIframeRef.current
    if (iframe) {
      sendDataTagPickerSetSelection(iframe, dataOrigin, scope, nextPending)
    }
    setCreateOpen(false)
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Associate catalog tags with this company. You can skip this step and add tags later.
        </p>
        <SelectTag
          multiple
          selectedTags={tags}
          placeholder="Choose tags"
          onClick={openPicker}
          disabled={!canOpen}
          aria-label="Open Data tag picker"
        />
      </div>

      <CustomDialog
        open={pickerOpen}
        onOpenChange={handleDialogOpenChange}
        title="Select tags"
        description="Choose one or more tags, then click Done."
        sizeWidth="small"
        sizeHeight="large"
        noContentPadding
        disableContentScroll
        nestedDismissGuard={createOpen}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" className="h-10 px-4" onClick={handleDone}>
              Done
              {pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
            </Button>
          </>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          {canOpen && accessToken ? (
            <DataTagPickerFrame
              key={`${pickerAttempt}-${accessToken}`}
              ref={pickerIframeRef}
              isOpen={pickerOpen}
              accessToken={accessToken}
              dataOrigin={dataOrigin}
              parentOrigin={window.location.origin}
              scope={scope}
              mode="multiple"
              selectedTags={values.tags}
              className="block h-full min-h-0 w-full border-0 bg-transparent"
              onSelectionChange={setPendingSelection}
              onCreateRequest={openCreateDialog}
              onCancel={() => handleDialogOpenChange(false)}
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-sm text-muted-foreground">
              Sign in and configure `VITE_DATA_ORIGIN` to select tags.
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
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" className="h-10 px-4" onClick={handleCreateSubmit}>
              Create
            </Button>
          </>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          {accessToken ? (
            <DataTagCreateFrame
              key={`${createAttempt}-${accessToken}`}
              ref={createIframeRef}
              isOpen={createOpen}
              accessToken={accessToken}
              dataOrigin={dataOrigin}
              parentOrigin={window.location.origin}
              scope={scope}
              className="block h-full min-h-0 w-full border-0 bg-transparent"
              onCreated={handleCreated}
              onCancel={() => setCreateOpen(false)}
            />
          ) : null}
        </div>
      </CustomDialog>
    </>
  )
}
