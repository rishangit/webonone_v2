import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardPaste } from 'lucide-react'
import type { ColorMode } from '@webonone/theme'
import {
  Alert,
  AlertDescription,
  Button,
  Callout,
  CalloutAction,
  CalloutDescription,
  CalloutTitle,
  CustomDialog,
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
  const suppressParentCloseRef = useRef(false)

  useEffect(() => {
    importOpenRef.current = importOpen
  }, [importOpen])

  useEffect(() => {
    if (!open) return
    setValues(initialValues ?? { ...platformDefaultFormValues })
    setFieldErrors({})
    importOpenRef.current = false
    setImportOpen(false)
  }, [open, initialValues])

  const handleImportOpenChange = useCallback((next: boolean) => {
    if (!next) {
      suppressParentCloseRef.current = true
      queueMicrotask(() => {
        suppressParentCloseRef.current = false
      })
    }
    importOpenRef.current = next
    setImportOpen(next)
  }, [])

  function handleRootOpenChange(next: boolean) {
    if (!next && (importOpenRef.current || suppressParentCloseRef.current)) {
      if (importOpenRef.current) {
        importOpenRef.current = false
        setImportOpen(false)
      }
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

  function openImportDialog() {
    importOpenRef.current = true
    setImportOpen(true)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleRootOpenChange}
      title={mode === 'create' ? 'Create theme' : 'Edit theme'}
      description={
        <>
          Define five palette colors (primary, secondary, accent, background, text) or import them
          from{' '}
          <a
            href="https://ccolorpalette.com/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            CColorPalette
          </a>
          . The preview updates as you edit.
        </>
      }
      sizeWidth="xlarge"
      sizeHeight="large"
      nestedDismissGuard={importOpen}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            onClick={() => handleRootOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" className="h-10" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : mode === 'create' ? 'Create theme' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <ThemeForm
            idPrefix={mode === 'create' ? 'create-theme' : 'edit-theme'}
            values={values}
            onChange={setValues}
            fieldErrors={fieldErrors}
            colorColumns={1}
          />

          <Callout>
            <CalloutTitle>Import from CColorPalette</CalloutTitle>
            <CalloutDescription>
              On{' '}
              <a
                href="https://ccolorpalette.com/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                CColorPalette
              </a>
              , choose a palette → <span className="font-medium text-foreground">Export</span> →{' '}
              <span className="font-medium text-foreground">CSS variables</span>, then paste the{' '}
              <code className="rounded bg-background/80 px-1 py-0.5 text-xs">:root {'{ … }'}</code>{' '}
              block here to fill all five colors at once.
            </CalloutDescription>
            <CalloutAction>
              <Button type="button" className="h-10" onClick={openImportDialog}>
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Paste CSS from CColorPalette
              </Button>
            </CalloutAction>
          </Callout>
        </div>

        <div className="min-h-0 lg:sticky lg:top-0 lg:self-start">
          <ThemePreview values={values} colorMode={colorMode} />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ThemeCssImportDialog
        open={importOpen}
        onOpenChange={handleImportOpenChange}
        onImport={handleImport}
      />
    </CustomDialog>
  )
}
