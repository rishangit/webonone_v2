import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  Button,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { createFontLibrarySchema } from '../schemas/websiteThemeSchemas'
import { websiteFontLibraryCreateActions, websiteFontLibraryUpdateActions } from '../store'
import type { WebsiteFontLibraryItem } from '../types'
import { themeFontFamilyStyle } from '../utils/themeFontPreview'
import { normalizeGoogleFontInput, parseGoogleFontFamily } from '../utils/parseGoogleFontFamily'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'

export function FontLibraryAddDialog({
  open,
  onOpenChange,
  item = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: WebsiteFontLibraryItem | null
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const create = useAppSelector((state) => state.websiteFontLibraryCreate)
  const update = useAppSelector((state) => state.websiteFontLibraryUpdate)
  const isEdit = Boolean(item)
  const saving = isEdit ? update.status === 'saving' : create.status === 'saving'
  const [name, setName] = useState('')
  const [googleFontUrl, setGoogleFontUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  const customUrl = normalizeGoogleFontInput(googleFontUrl)
  const customFamily = parseGoogleFontFamily(customUrl)
  const customPreview = customFamily ? themeFontFamilyStyle(customFamily) : undefined

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setGoogleFontUrl(item?.googleFontUrl ?? '')
    setFieldErrors({})
    dispatch(websiteFontLibraryCreateActions.createReset())
    dispatch(websiteFontLibraryUpdateActions.updateReset())
  }, [dispatch, item, open])

  useEffect(() => {
    if (!isEdit && create.status === 'succeeded') {
      toast({ title: t('fontLibraryAdded') })
      dispatch(websiteFontLibraryCreateActions.createReset())
      onOpenChange(false)
    }
    if (!isEdit && create.status === 'error') {
      toast({
        title: t('fontLibrarySaveFailed'),
        description: create.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteFontLibraryCreateActions.createReset())
    }
  }, [create.error, create.status, dispatch, isEdit, onOpenChange, t, toast])

  useEffect(() => {
    if (isEdit && update.status === 'succeeded') {
      toast({ title: t('fontLibraryUpdated') })
      dispatch(websiteFontLibraryUpdateActions.updateReset())
      onOpenChange(false)
    }
    if (isEdit && update.status === 'error') {
      toast({
        title: t('fontLibrarySaveFailed'),
        description: update.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteFontLibraryUpdateActions.updateReset())
    }
  }, [dispatch, isEdit, onOpenChange, t, toast, update.error, update.status])

  function submit() {
    const family = customFamily ?? ''
    const parsed = createFontLibrarySchema.safeParse({
      name: name.trim(),
      googleFontUrl: customUrl,
      family,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    if (isEdit && item) {
      dispatch(websiteFontLibraryUpdateActions.updateRequested({ id: item.id, ...parsed.data }))
      return
    }
    dispatch(websiteFontLibraryCreateActions.createRequested(parsed.data))
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('editFontLibraryTitle') : t('addFontToLibraryTitle')}
      description={isEdit ? t('editFontLibraryDescription') : t('addFontToLibraryDescription')}
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
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={saving}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {saving ? t('creating') : tc('save')}
          </Button>
        </>
      }
    >
      <Form className="space-y-4">
        {customFamily && customUrl ? <link rel="stylesheet" href={customUrl} /> : null}
        <FormField label={t('styleName')} htmlFor="library-font-name" required error={fieldErrors.name}>
          <Input id="library-font-name" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label={t('googleFontUrl')} htmlFor="library-font-url" required error={fieldErrors.googleFontUrl}>
          <Input
            id="library-font-url"
            value={googleFontUrl}
            onChange={(event) => {
              setGoogleFontUrl(event.target.value)
              setFieldErrors((current) => ({ ...current, googleFontUrl: undefined }))
            }}
            placeholder="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          />
        </FormField>
        <p className="text-sm text-muted-foreground">{t('googleFontUrlHint')}</p>
        <FormField label={t('fontFamily')} htmlFor="library-font-family" error={fieldErrors.family}>
          <Input id="library-font-family" value={customFamily ?? ''} readOnly style={customPreview} />
          {customFamily ? (
            <p className="text-sm text-muted-foreground" style={customPreview}>
              {t('textPreviewSample')}
            </p>
          ) : null}
        </FormField>
      </Form>
    </CustomDialog>
  )
}
