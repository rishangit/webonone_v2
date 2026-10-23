import { useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Button,
  ColorInput,
  CustomDialog,
  Form,
  FormField,
  Input,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteColorTokenSchema } from '../schemas/websiteThemeSchemas'
import type { WebsiteColorToken } from '../types'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'
import type { ThemeColorPaletteEditSection } from './ThemeColorPaletteItemEditor'

type PaletteColorDraft = { id: string; name: string; value: string }

function mapPaletteColorFieldErrors(
  index: number,
  issues: { path: PropertyKey[]; message: string }[],
): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {}
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '')
    if (key === 'name') errors[`color_${index}_name`] = issue.message
    else if (key === 'value') errors[`color_${index}_value`] = issue.message
    else if (key === 'id') errors[`color_${index}_id`] = issue.message
    else errors[`color_${index}_${key}`] = issue.message
  }
  return errors
}

function themePaletteEditPath(themeId: string, paletteId: string, section: ThemeColorPaletteEditSection): string {
  const base = `/embed/dialogs/website/themes/${encodeURIComponent(themeId)}/palettes/${encodeURIComponent(paletteId)}/edit`
  return `${base}?section=${encodeURIComponent(section)}`
}

export function ThemeColorPaletteEditDialog({
  open,
  themeId,
  paletteId,
  section,
  paletteName,
  colors,
  takenColorValues,
  onOpenChange,
  onSaveOverview,
  onSaveColors,
  chrome = 'dialog',
}: {
  open: boolean
  themeId: string
  paletteId: string
  section: ThemeColorPaletteEditSection | null
  paletteName: string
  colors: PaletteColorDraft[]
  takenColorValues: string[]
  onOpenChange: (open: boolean) => void
  onSaveOverview: (name: string) => void
  onSaveColors: (next: WebsiteColorToken[]) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [name, setName] = useState(paletteName)
  const [drafts, setDrafts] = useState<PaletteColorDraft[]>(colors)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const editSessionRef = useRef<string | null>(null)
  const isOverview = section === 'overview'
  const title = isOverview ? t('editThemePaletteOverviewTitle') : t('editThemePaletteColorsTitle')
  const description = isOverview ? t('editThemePaletteOverviewDescription') : t('editThemePaletteColorsDescription')
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open && section !== null,
    path: section ? themePaletteEditPath(themeId, paletteId, section) : '',
    title,
    description,
    submitLabel: tc('save'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: (payload) => {
      const record = payload as Record<string, unknown> | undefined
      if (record?.kind === 'themePaletteOverview' && typeof record.name === 'string') {
        onSaveOverview(record.name.trim())
      }
      if (record?.kind === 'themePaletteColors' && Array.isArray(record.colors)) {
        const parsed = record.colors
          .map((entry) => websiteColorTokenSchema.safeParse(entry))
          .filter((result) => result.success)
          .map((result) => result.data!)
        if (parsed.length === record.colors.length) onSaveColors(parsed)
      }
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useLayoutEffect(() => {
    if (!open && chrome === 'dialog') {
      editSessionRef.current = null
      return
    }
    if (!open) {
      editSessionRef.current = null
      return
    }
    if (!section) return
    const sessionKey = `${paletteId}:${section}`
    if (editSessionRef.current === sessionKey) return
    editSessionRef.current = sessionKey
    setName(paletteName)
    setDrafts(colors)
    setFieldErrors({})
  }, [chrome, colors, open, paletteId, paletteName, section])

  function submit() {
    if (section === 'overview') {
      const trimmed = name.trim()
      if (!trimmed) {
        setFieldErrors({ name: t('paletteNameRequired') })
        return
      }
      if (dialogRequestId && parentOrigin) {
        sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId, {
          kind: 'themePaletteOverview',
          name: trimmed,
        })
        return
      }
      onSaveOverview(trimmed)
      onOpenChange(false)
      return
    }
    if (section === 'colors') {
      const taken = new Set(
        takenColorValues
          .filter((value) => !colors.some((color) => color.value.toLowerCase() === value.toLowerCase()))
          .map((value) => value.trim().toLowerCase()),
      )
      const parsed: WebsiteColorToken[] = []
      const errors: Partial<Record<string, string>> = {}
      drafts.forEach((draft, index) => {
        const normalized = draft.value.trim().toLowerCase()
        if (taken.has(normalized)) {
          errors[`color_${index}_value`] = t('colorAlreadyOnTheme')
          return
        }
        const result = websiteColorTokenSchema.safeParse({
          id: draft.id,
          name: draft.name.trim(),
          value: draft.value,
        })
        if (!result.success) {
          Object.assign(errors, mapPaletteColorFieldErrors(index, result.error.issues))
          return
        }
        parsed.push(result.data)
      })
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }
      if (dialogRequestId && parentOrigin) {
        sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId, {
          kind: 'themePaletteColors',
          colors: parsed,
        })
        return
      }
      onSaveColors(parsed)
      onOpenChange(false)
    }
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: submit,
  })

  const body = isOverview ? (
    <Form className="space-y-4">
      <FormField label={t('paletteName')} htmlFor="theme-palette-name" required error={fieldErrors.name}>
        <Input id="theme-palette-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
    </Form>
  ) : (
    <Form className="space-y-4">
      {drafts.map((draft, index) => (
        <div key={draft.id} className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] p-4">
          <FormField
            label={t('colorName')}
            htmlFor={`theme-palette-color-name-${index}`}
            required
            error={fieldErrors[`color_${index}_name`]}
          >
            <Input
              id={`theme-palette-color-name-${index}`}
              value={draft.name}
              onChange={(event) =>
                setDrafts((current) =>
                  current.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, name: event.target.value } : entry,
                  ),
                )
              }
            />
          </FormField>
          <FormField
            label={t('colorValue')}
            htmlFor={`theme-palette-color-value-${index}`}
            required
            error={fieldErrors[`color_${index}_value`] || fieldErrors.value}
          >
            <ColorInput
              id={`theme-palette-color-value-${index}`}
              value={draft.value}
              onChange={(value) =>
                setDrafts((current) =>
                  current.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, value } : entry,
                  ),
                )
              }
            />
          </FormField>
        </div>
      ))}
    </Form>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth={WEBSITE_PAGE_DIALOG_SIZE.sizeWidth}
      sizeHeight={WEBSITE_PAGE_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {tc('save')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
