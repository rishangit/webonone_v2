import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  isDataTagPickerCreateSubmitMessage,
  PLATFORM_EMBED_QUERY,
  sendDataTagCreated,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  ColorInput,
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
import { randomTagColor } from '@/features/tags/utils/randomTagColor'
import { dataApi } from '@/shared/services/dataApi'

export const TAG_CREATE_FORM_ID = 'data-tag-create-form'

function createEmptyTagValues(): TagFormValues {
  return {
    name: '',
    description: '',
    color: randomTagColor(),
    status: 'pending',
  }
}

export function TagCreatePage() {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const canSetStatus = userRole === 'super_admin'
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEmbed = searchParams.get(PLATFORM_EMBED_QUERY.EMBED) === PLATFORM_EMBED_QUERY.EMBED_VALUE
  const scope = (searchParams.get(PLATFORM_EMBED_QUERY.SCOPE) ?? '').trim()
  const isValid = isEmbed && Boolean(parentOrigin) && scope.length > 0

  const [values, setValues] = useState<TagFormValues>(createEmptyTagValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const submitForm = useCallback(async () => {
    if (savingRef.current || !parentOrigin || !scope) {
      return
    }

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

    savingRef.current = true
    setSaving(true)
    setFormError(null)
    try {
      const tag = await dataApi.createTag({
        name: parsed.data.name,
        description: parsed.data.description || null,
        color: parsed.data.color,
        status: canSetStatus ? parsed.data.status : 'pending',
      })
      sendDataTagCreated(parentOrigin, scope, {
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [canSetStatus, parentOrigin, scope, values])

  useEffect(() => {
    if (!parentOrigin || !scope) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) {
        return
      }
      if (!isDataTagPickerCreateSubmitMessage(event.data) || event.data.scope !== scope) {
        return
      }
      void submitForm()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin, scope, submitForm])

  function updateField<K extends keyof TagFormValues>(key: K, value: TagFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submitForm()
  }

  if (!isValid) {
    return (
      <div className="mx-auto flex min-h-[240px] w-full max-w-md items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform iframe embeds with a valid parent origin and scope.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
      </div>
    )
  }

  return (
    <div className="w-full p-4 sm:p-6">
      <form id={TAG_CREATE_FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField label="Name" htmlFor="tag-name" required error={fieldErrors.name}>
          <Input
            id="tag-name"
            value={values.name}
            onChange={(e) => updateField('name', e.target.value)}
            disabled={saving}
          />
        </FormField>

        <FormField label="Description" htmlFor="tag-description" error={fieldErrors.description}>
          <Textarea
            id="tag-description"
            value={values.description}
            onChange={(e) => updateField('description', e.target.value)}
            disabled={saving}
          />
        </FormField>

        <FormField label="Color" htmlFor="tag-color" required error={fieldErrors.color}>
          <ColorInput
            id="tag-color"
            value={values.color}
            onChange={(color) => updateField('color', color)}
            disabled={saving}
          />
        </FormField>

        {canSetStatus ? (
          <FormField label="Status" htmlFor="tag-status" required error={fieldErrors.status}>
            <Select
              value={values.status}
              onValueChange={(v) => updateField('status', v as TagFormValues['status'])}
            >
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
    </div>
  )
}
