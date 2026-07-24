import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  ColorInput,
  CustomDialog,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { tagFormSchema, type TagFormValues } from '@/features/tags/schemas/tagSchemas'
import { tagsActions } from '@/features/tags/store'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
import type { Tag } from '@/shared/types/data.types'

const defaultValues: TagFormValues = {
  name: '',
  description: '',
  color: '#3366FF',
  status: 'pending',
}

interface TagFormDialogProps {
  open: boolean
  id?: string
  onOpenChange: (open: boolean) => void
  onSaved: (tag?: Tag) => void
  chrome?: 'dialog' | 'embed-page'
}

export function TagFormDialog({
  open,
  id,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: TagFormDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isNew = !id
  const title = isNew ? 'Create tag' : 'Edit tag'
  const path = isNew ? '/embed/dialogs/tags/create' : `/embed/dialogs/tags/${id}/edit`
  const idleSubmitLabel = isNew ? 'Create tag' : 'Save changes'
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    submitLabel: idleSubmitLabel,
    ...DATA_FORM_DIALOG_SIZE,
    onResult: (payload) => {
      const tag =
        payload &&
        typeof payload === 'object' &&
        typeof (payload as Tag).id === 'string' &&
        typeof (payload as Tag).name === 'string' &&
        typeof (payload as Tag).color === 'string'
          ? (payload as Tag)
          : undefined
      onSaved(tag)
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  const userRole = useAppSelector((s) => s.auth.user?.role)
  const canSetStatus = userRole === 'super_admin'
  const [values, setValues] = useState<TagFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor<Tag>(id, isNew, (s) => s.tags, tagsActions)

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      handleSubmit()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      editor.saving,
      editor.saving ? 'Saving…' : idleSubmitLabel,
    )
  }, [chrome, dialogRequestId, editor.saving, idleSubmitLabel, parentOrigin])

  useEffect(() => {
    if (!editor.detail || isNew) return
    const tag = editor.detail
    setValues({
      name: tag.name,
      description: tag.description ?? '',
      color: tag.color,
      status: tag.status,
    })
  }, [editor.detail, isNew])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) onSaved(editor.detail ?? undefined)
  }, [editor.detail, editor.saving, editor.error, onSaved])

  function updateField<K extends keyof TagFormValues>(key: K, value: TagFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    const parsed = tagFormSchema.safeParse(values)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string') errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    submittedRef.current = true
    editor.save({
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
      status: canSetStatus ? parsed.data.status : 'pending',
    })
  }

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={editor.saving}
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={() => handleSubmit()}
        disabled={editor.saving || editor.loading}
      >
        {editor.saving ? 'Saving…' : idleSubmitLabel}
      </Button>
    </>
  )

  const body = editor.loading ? (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  ) : (
    <form id="tag-form" className="space-y-4" onSubmit={handleSubmit}>
      {editor.error ? (
        <Alert variant="destructive">
          <AlertDescription>{editor.error}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Name" htmlFor="tag-name" required error={fieldErrors.name}>
        <Input id="tag-name" value={values.name} onChange={(e) => updateField('name', e.target.value)} />
      </FormField>

      <FormField label="Description" htmlFor="tag-description" error={fieldErrors.description}>
        <Textarea
          id="tag-description"
          value={values.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </FormField>

      <FormField label="Color" htmlFor="tag-color" required error={fieldErrors.color}>
        <ColorInput
          id="tag-color"
          value={values.color}
          onChange={(color) => updateField('color', color)}
        />
      </FormField>

      {canSetStatus ? (
        <FormField label="Status" htmlFor="tag-status" required error={fieldErrors.status}>
          <Select value={values.status} onValueChange={(v) => updateField('status', v as TagFormValues['status'])}>
            <SelectTrigger id="tag-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Unverified</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
    </form>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      sizeWidth={DATA_FORM_DIALOG_SIZE.sizeWidth}
      sizeHeight={DATA_FORM_DIALOG_SIZE.sizeHeight}
      footer={actions}
    >
      {body}
    </CustomDialog>
  )
}
