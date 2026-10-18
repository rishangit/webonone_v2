import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  Button,
  ColorInput,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { createColorLibrarySchema } from '../schemas/websiteThemeSchemas'
import { websiteColorLibraryCreateActions, websiteColorLibraryUpdateActions } from '../store'
import type { WebsiteColorLibraryItem, WebsiteColorLibraryPalette } from '../types'
import {
  COLOR_LIBRARY_PALETTE_KEYS,
  emptyColorLibraryPalette,
} from '../utils/colorLibraryPalette'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'

export function ColorLibraryAddDialog({
  open,
  onOpenChange,
  item = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: WebsiteColorLibraryItem | null
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const create = useAppSelector((state) => state.websiteColorLibraryCreate)
  const update = useAppSelector((state) => state.websiteColorLibraryUpdate)
  const isEdit = Boolean(item)
  const saving = isEdit ? update.status === 'saving' : create.status === 'saving'
  const [name, setName] = useState('')
  const [palette, setPalette] = useState<WebsiteColorLibraryPalette>(emptyColorLibraryPalette('#175E83'))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setPalette(item?.palette ?? emptyColorLibraryPalette('#175E83'))
    setFieldErrors({})
    dispatch(websiteColorLibraryCreateActions.createReset())
    dispatch(websiteColorLibraryUpdateActions.updateReset())
  }, [dispatch, item, open])

  useEffect(() => {
    if (!isEdit && create.status === 'succeeded') {
      toast({ title: t('colorLibraryAdded') })
      dispatch(websiteColorLibraryCreateActions.createReset())
      onOpenChange(false)
    }
    if (!isEdit && create.status === 'error') {
      toast({
        title: t('colorLibrarySaveFailed'),
        description: create.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteColorLibraryCreateActions.createReset())
    }
  }, [create.error, create.status, dispatch, isEdit, onOpenChange, t, toast])

  useEffect(() => {
    if (isEdit && update.status === 'succeeded') {
      toast({ title: t('colorLibraryUpdated') })
      dispatch(websiteColorLibraryUpdateActions.updateReset())
      onOpenChange(false)
    }
    if (isEdit && update.status === 'error') {
      toast({
        title: t('colorLibrarySaveFailed'),
        description: update.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteColorLibraryUpdateActions.updateReset())
    }
  }, [dispatch, isEdit, onOpenChange, t, toast, update.error, update.status])

  function submit() {
    const parsed = createColorLibrarySchema.safeParse({ name: name.trim(), palette })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    if (isEdit && item) {
      dispatch(websiteColorLibraryUpdateActions.updateRequested({ id: item.id, ...parsed.data }))
      return
    }
    dispatch(websiteColorLibraryCreateActions.createRequested(parsed.data))
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('editColorPaletteLibraryTitle') : t('addColorPaletteToLibraryTitle')}
      description={isEdit ? t('editColorPaletteLibraryDescription') : t('addColorPaletteToLibraryDescription')}
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
        <FormField label={t('paletteName')} htmlFor="library-palette-name" required error={fieldErrors.name}>
          <Input id="library-palette-name" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          {COLOR_LIBRARY_PALETTE_KEYS.map((key, index) => (
            <FormField
              key={key}
              label={t('paletteColorSlot', { index: index + 1 })}
              htmlFor={`library-palette-${key}`}
              required
              error={fieldErrors[`palette.${key}`]}
            >
              <ColorInput
                id={`library-palette-${key}`}
                value={palette[key]}
                onChange={(value) => setPalette({ ...palette, [key]: value })}
              />
            </FormField>
          ))}
        </div>
      </Form>
    </CustomDialog>
  )
}
