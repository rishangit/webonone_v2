import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
  Checkbox,
  CustomDialog,
  Form,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { layoutMetaSchema, type LayoutMetaValues } from '../schemas/websiteMeta'
import type { WebsiteChrome, WebsiteLayout, WebsiteTheme } from '../types'

export const WEBSITE_LAYOUT_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

interface WebsiteLayoutDialogProps {
  open: boolean
  isSaving: boolean
  error: string | null
  entityId?: string
  initial?: LayoutMetaValues
  headers: WebsiteChrome[]
  footers: WebsiteChrome[]
  themes?: WebsiteTheme[]
  assignedPages?: WebsiteLayout['pages']
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LayoutMetaValues) => void
  onHostedSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}

function noneValue(value: string | null | undefined): string {
  return value || '__none'
}

function fromSelect(value: string): string | null {
  return value === '__none' ? null : value
}

export function WebsiteLayoutDialog({
  open,
  isSaving,
  error,
  entityId,
  initial,
  headers,
  footers,
  themes = [],
  assignedPages = [],
  onOpenChange,
  onSubmit,
  onHostedSaved,
  chrome = 'dialog',
}: WebsiteLayoutDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const defaultThemeId = themes.find((item) => item.isDefault)?.id ?? themes[0]?.id ?? null
  const [values, setValues] = useState<LayoutMetaValues>(
    initial ?? { name: '', headerId: null, footerId: null, themeId: defaultThemeId ?? undefined, isDefault: false, pageIds: [] },
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: entityId
      ? `/embed/dialogs/website/layouts/${entityId}`
      : '/embed/dialogs/website/layouts/create',
    title: isEdit ? t('editLayoutTitle') : t('createLayoutTitle'),
    description: isEdit ? t('editLayoutDescription') : t('createLayoutDescription'),
    submitLabel: isEdit ? tc('save') : t('create'),
    ...WEBSITE_LAYOUT_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onHostedSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const pageIds = initial?.pageIds ?? assignedPages.map((page) => page.id)
    setValues(
      initial
        ? { ...initial, pageIds, themeId: initial.themeId ?? null }
        : { name: '', headerId: null, footerId: null, themeId: defaultThemeId ?? undefined, isDefault: false, pageIds: [] },
    )
    setFieldErrors({})
  }, [assignedPages, chrome, initial, open])

  useEffect(() => {
    if (isEdit || values.themeId !== undefined || !defaultThemeId) return
    setValues((prev) => (prev.themeId === undefined ? { ...prev, themeId: defaultThemeId } : prev))
  }, [defaultThemeId, isEdit, values.themeId])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, isSaving)
  }, [dialogRequestId, isSaving, parentOrigin])

  function movePage(index: number, direction: -1 | 1) {
    setValues((prev) => {
      const pageIds = [...(prev.pageIds ?? [])]
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= pageIds.length) return prev
      const swap = pageIds[index]
      pageIds[index] = pageIds[nextIndex]!
      pageIds[nextIndex] = swap!
      return { ...prev, pageIds }
    })
  }

  function submit() {
    const parsed = layoutMetaSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: submit,
  })

  const orderedPages = (values.pageIds ?? [])
    .map((id) => assignedPages.find((page) => page.id === id))
    .filter((page): page is WebsiteLayout['pages'][number] => Boolean(page))

  const body = (
    <Form className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label={t('name')} htmlFor="website-layout-name" required error={fieldErrors.name}>
        <Input
          id="website-layout-name"
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          disabled={isSaving}
        />
      </FormField>
      <FormField label={t('header')} htmlFor="website-layout-header">
        <Select
          value={noneValue(values.headerId)}
          onValueChange={(value) => setValues((prev) => ({ ...prev, headerId: fromSelect(value) }))}
        >
          <SelectTrigger id="website-layout-header">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t('common:none')}</SelectItem>
            {headers.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('footer')} htmlFor="website-layout-footer">
        <Select
          value={noneValue(values.footerId)}
          onValueChange={(value) => setValues((prev) => ({ ...prev, footerId: fromSelect(value) }))}
        >
          <SelectTrigger id="website-layout-footer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t('common:none')}</SelectItem>
            {footers.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('theme')} htmlFor="website-layout-theme">
        <Select
          value={noneValue(values.themeId)}
          onValueChange={(value) => setValues((prev) => ({ ...prev, themeId: fromSelect(value) }))}
        >
          <SelectTrigger id="website-layout-theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t('common:none')}</SelectItem>
            {themes.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={Boolean(values.isDefault)}
          onCheckedChange={(value) => setValues((prev) => ({ ...prev, isDefault: value === true }))}
        />
        {t('isDefaultLayout')}
      </label>
      {isEdit && orderedPages.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('menuOrder')}</p>
          <p className="text-sm text-muted-foreground">{t('menuOrderHint')}</p>
          <ul className="space-y-2">
            {orderedPages.map((page, index) => (
              <li
                key={page.id}
                className="flex items-center gap-2 rounded-md border border-[hsl(var(--glass-border))] px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{page.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={t('movePageUp')}
                  disabled={index === 0 || isSaving}
                  onClick={() => movePage(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={t('movePageDown')}
                  disabled={index === orderedPages.length - 1 || isSaving}
                  onClick={() => movePage(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
      title={isEdit ? t('editLayoutTitle') : t('createLayoutTitle')}
      description={isEdit ? t('editLayoutDescription') : t('createLayoutDescription')}
      sizeWidth={WEBSITE_LAYOUT_DIALOG_SIZE.sizeWidth}
      sizeHeight={WEBSITE_LAYOUT_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={isSaving}>
            {isSaving ? (isEdit ? t('saving') : t('creating')) : isEdit ? tc('save') : t('create')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
