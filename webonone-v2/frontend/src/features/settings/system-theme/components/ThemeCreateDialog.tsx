import { useEffect, useRef, useState } from 'react'
import type { ColorMode } from '@webonone/theme'
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { platformDefaultFormValues } from '../constants/defaultThemeFormValues'
import { themeFormSchema, type ThemeFormValues } from '../schemas/themeFormSchema'
import type { ParsedThemeColors } from '../utils/parseCssThemeVariables'
import { ThemeCssImportDialog } from './ThemeCssImportDialog'
import { ThemeForm } from './ThemeForm'
import { ThemePreview } from './ThemePreview'

interface ThemeCreateDialogProps {
  mode: 'create' | 'edit'
  open: boolean
  initialValues?: ThemeFormValues
  colorMode: ColorMode
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ThemeFormValues) => void
}

export function ThemeCreateDialog({
  mode,
  open,
  initialValues,
  colorMode,
  isSaving,
  error,
  onOpenChange,
  onSubmit,
}: ThemeCreateDialogProps) {
  const [values, setValues] = useState<ThemeFormValues>({ ...platformDefaultFormValues })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ThemeFormValues, string>>>({})
  const [importOpen, setImportOpen] = useState(false)
  const importOpenRef = useRef(false)

  useEffect(() => {
    importOpenRef.current = importOpen
  }, [importOpen])

  useEffect(() => {
    if (!open) return
    setValues(initialValues ?? { ...platformDefaultFormValues })
    setFieldErrors({})
    setImportOpen(false)
  }, [open, initialValues])

  function handleRootOpenChange(next: boolean) {
    if (!next && importOpenRef.current) {
      setImportOpen(false)
      return
    }
    onOpenChange(next)
  }

  function handleSubmit() {
    const parsed = themeFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    onSubmit(parsed.data)
  }

  function handleImport(colors: ParsedThemeColors) {
    setValues((current) => ({
      ...current,
      color1: colors.color1,
      color2: colors.color2,
      color3: colors.color3,
      color4: colors.color4,
      color5: colors.color5,
    }))
    setFieldErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={handleRootOpenChange}>
      <DialogContent
        size="2xl"
        onInteractOutside={(e) => {
          if (importOpenRef.current) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (importOpenRef.current) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create theme' : 'Edit theme'}</DialogTitle>
            <DialogDescription>
              Build a harmonious palette on{' '}
              <a
                href="https://ccolorpalette.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                CColorPalette
              </a>
              . Palette sites export five colors only — this form maps them as: primary, secondary,
              accent, background, and text (see field labels). Paste CSS variables or enter hex values
              below.
            </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <ThemeForm
              idPrefix={mode === 'create' ? 'create-theme' : 'edit-theme'}
              values={values}
              onChange={setValues}
              fieldErrors={fieldErrors}
            />

            <Button type="button" variant="link" className="h-auto p-0" onClick={() => setImportOpen(true)}>
              Paste from CColorPalette
            </Button>

            <ThemePreview values={values} colorMode={colorMode} />
          </div>

          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleRootOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : mode === 'create' ? 'Create theme' : 'Save changes'}
          </Button>
        </DialogFooter>

        <ThemeCssImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
      </DialogContent>
    </Dialog>
  )
}
