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
} from '@webonone/ui-kit'
import { websiteColorTokenSchema } from '../schemas/websiteThemeSchemas'
import type { WebsiteColorToken } from '../types'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'
import type { ThemeColorPaletteEditSection } from './ThemeColorPaletteItemEditor'

type PaletteColorDraft = { id: string; name: string; value: string }

export function ThemeColorPaletteEditDialog({
  open,
  section,
  paletteName,
  colors,
  takenColorValues,
  onOpenChange,
  onSaveOverview,
  onSaveColors,
}: {
  open: boolean
  section: ThemeColorPaletteEditSection | null
  paletteName: string
  colors: PaletteColorDraft[]
  takenColorValues: string[]
  onOpenChange: (open: boolean) => void
  onSaveOverview: (name: string) => void
  onSaveColors: (next: WebsiteColorToken[]) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [name, setName] = useState(paletteName)
  const [drafts, setDrafts] = useState<PaletteColorDraft[]>(colors)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setName(paletteName)
    setDrafts(colors)
    setFieldErrors({})
  }, [colors, open, paletteName])

  function submit() {
    if (section === 'overview') {
      const trimmed = name.trim()
      if (!trimmed) {
        setFieldErrors({ name: t('paletteNameRequired') })
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
          Object.assign(errors, mapZodIssuesToFieldErrors(result.error.issues))
          return
        }
        parsed.push(result.data)
      })
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }
      onSaveColors(parsed)
      onOpenChange(false)
    }
  }

  const isOverview = section === 'overview'

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isOverview ? t('editThemePaletteOverviewTitle') : t('editThemePaletteColorsTitle')}
      description={isOverview ? t('editThemePaletteOverviewDescription') : t('editThemePaletteColorsDescription')}
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
      {isOverview ? (
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
      )}
    </CustomDialog>
  )
}
