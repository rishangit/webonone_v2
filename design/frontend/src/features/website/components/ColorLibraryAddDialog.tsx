import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Save, Trash2 } from 'lucide-react'
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
import type { WebsiteColorLibraryColor, WebsiteColorLibraryItem, WebsiteColorLibraryPalette } from '../types'
import {
  COLOR_LIBRARY_PALETTE_MAX_COLORS,
  emptyColorLibraryPalette,
  libraryPaletteFromCssSwatches,
  normalizeColorLibraryPalette,
} from '../utils/colorLibraryPalette'
import { CColorPaletteImportCallout } from './CColorPaletteImportCallout'
import { ThemeCssImportDialog } from './theme-editor/ThemeCssImportDialog'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'

function clonePalette(palette: WebsiteColorLibraryPalette): WebsiteColorLibraryPalette {
  return {
    colors: palette.colors.map((entry) => ({ ...entry })),
  }
}

export function ColorLibraryAddDialog({
  open,
  onOpenChange,
  item = null,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: WebsiteColorLibraryItem | null
  onSaved?: () => void
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
  const [importOpen, setImportOpen] = useState(false)
  const editSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      editSessionRef.current = null
      return
    }
    const sessionKey = item?.id ?? 'create'
    if (editSessionRef.current === sessionKey) return
    editSessionRef.current = sessionKey
    setName(item?.name ?? '')
    setPalette(clonePalette(item?.palette ?? emptyColorLibraryPalette('#175E83')))
    setFieldErrors({})
    dispatch(websiteColorLibraryCreateActions.createReset())
    dispatch(websiteColorLibraryUpdateActions.updateReset())
  }, [dispatch, item?.id, open])

  useEffect(() => {
    if (!isEdit && create.status === 'succeeded') {
      toast({ title: t('colorLibraryAdded') })
      dispatch(websiteColorLibraryCreateActions.createReset())
      onOpenChange(false)
      onSaved?.()
    }
    if (!isEdit && create.status === 'error') {
      toast({
        title: t('colorLibrarySaveFailed'),
        description: create.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteColorLibraryCreateActions.createReset())
    }
  }, [create.error, create.status, dispatch, isEdit, onOpenChange, onSaved, t, toast])

  useEffect(() => {
    if (isEdit && update.status === 'succeeded') {
      toast({ title: t('colorLibraryUpdated') })
      dispatch(websiteColorLibraryUpdateActions.updateReset())
      onOpenChange(false)
      onSaved?.()
    }
    if (isEdit && update.status === 'error') {
      toast({
        title: t('colorLibrarySaveFailed'),
        description: update.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteColorLibraryUpdateActions.updateReset())
    }
  }, [dispatch, isEdit, onOpenChange, onSaved, t, toast, update.error, update.status])

  function updateColor(index: number, patch: Partial<WebsiteColorLibraryColor>) {
    setPalette((current) => ({
      colors: current.colors.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }))
  }

  function addColor() {
    if (palette.colors.length >= COLOR_LIBRARY_PALETTE_MAX_COLORS) return
    const nextIndex = palette.colors.length + 1
    setPalette((current) => ({
      colors: [
        ...current.colors,
        { name: t('paletteColorSlot', { index: nextIndex }), value: '#175E83' },
      ],
    }))
  }

  function removeColor(index: number) {
    if (palette.colors.length <= 1) return
    setPalette((current) => ({
      colors: current.colors.filter((_, entryIndex) => entryIndex !== index),
    }))
  }

  function submit() {
    const normalized = normalizeColorLibraryPalette(palette)
    const parsed = createColorLibrarySchema.safeParse({ name: name.trim(), palette: normalized })
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
    <>
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
        <CColorPaletteImportCallout disabled={saving} onOpenImport={() => setImportOpen(true)} />
        <FormField label={t('paletteName')} htmlFor="library-palette-name" required error={fieldErrors.name}>
          <Input id="library-palette-name" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{t('paletteColorsInPalette')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              disabled={palette.colors.length >= COLOR_LIBRARY_PALETTE_MAX_COLORS}
              onClick={addColor}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              {t('addColor')}
            </Button>
          </div>
          {palette.colors.map((color, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border border-[hsl(var(--glass-border))] p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <FormField
                label={t('colorName')}
                htmlFor={`library-palette-color-name-${index}`}
                required
                error={fieldErrors[`palette.colors.${index}.name`]}
              >
                <Input
                  id={`library-palette-color-name-${index}`}
                  value={color.name}
                  onChange={(event) => updateColor(index, { name: event.target.value })}
                />
              </FormField>
              <FormField
                label={t('colorValue')}
                htmlFor={`library-palette-color-value-${index}`}
                required
                error={fieldErrors[`palette.colors.${index}.value`]}
              >
                <ColorInput
                  id={`library-palette-color-value-${index}`}
                  value={color.value}
                  onChange={(value) => updateColor(index, { value })}
                />
              </FormField>
              <div className="flex items-end pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive hover:text-destructive"
                  disabled={palette.colors.length <= 1}
                  aria-label={t('removePaletteColor', { name: color.name || t('paletteColorSlot', { index: index + 1 }) })}
                  onClick={() => removeColor(index)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
          {fieldErrors['palette.colors'] ? (
            <p className="text-sm text-destructive">{fieldErrors['palette.colors']}</p>
          ) : null}
        </div>
      </Form>
    </CustomDialog>
    <ThemeCssImportDialog
      open={importOpen}
      onOpenChange={setImportOpen}
      onImport={(swatches) => {
        setPalette(
          libraryPaletteFromCssSwatches(swatches, (slotIndex) =>
            t('paletteColorSlot', { index: slotIndex }),
          ),
        )
        setFieldErrors((current) => {
          const next = { ...current }
          delete next['palette.colors']
          for (const key of Object.keys(next)) {
            if (key.startsWith('palette.colors.')) delete next[key]
          }
          return next
        })
        setImportOpen(false)
      }}
    />
    </>
  )
}
