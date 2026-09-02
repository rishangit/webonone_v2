import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { platformDefaultFormValues } from '../constants/defaultThemeFormValues'
import {
  EMPTY_THEME_WIZARD_VALUES,
  THEME_WIZARD_TOTAL_STEPS,
  themeBasicsSchema,
  themeFormSchema,
  themePaletteSchema,
  type ThemeFormValues,
  type ThemeWizardStep,
} from '../schemas/themeFormSchema'
import type { ApiTheme } from '../services/themeApi'
import { systemThemeActions } from '../store/systemThemeSlice'
import type { ParsedThemeColors } from '../utils/parseCssThemeVariables'
import { themeFormFromDto } from '../utils/themeFormMapping'
import { ThemeCssImportDialog } from './ThemeCssImportDialog'
import { ThemeWizardProgress } from './theme-wizard/ThemeWizardProgress'
import { ThemeWizardStepBasics } from './theme-wizard/ThemeWizardStepBasics'
import { ThemeWizardStepPalette } from './theme-wizard/ThemeWizardStepPalette'
import { ThemeWizardStepSummary } from './theme-wizard/ThemeWizardStepSummary'

const STEP_TITLES = ['Basics', 'Palette', 'Summary'] as const

const STEP_DESCRIPTIONS_CREATE = [
  'Name your theme.',
  'Define five palette colors or import them from CColorPalette.',
  'Review your theme before creating it.',
] as const

const STEP_DESCRIPTIONS_EDIT = [
  'Theme name.',
  'Palette colors (primary, secondary, background, surface, text).',
  'Review your changes before saving.',
] as const

function valuesFromTheme(theme: ApiTheme): ThemeFormValues {
  return themeFormFromDto(theme)
}

function emptyValues(): ThemeFormValues {
  return {
    ...EMPTY_THEME_WIZARD_VALUES,
    primary: platformDefaultFormValues.primary,
    secondary: platformDefaultFormValues.secondary,
    background: platformDefaultFormValues.background,
    surface: platformDefaultFormValues.surface,
    text: platformDefaultFormValues.text,
  }
}

export interface ThemeFormDialogProps {
  open: boolean
  id?: string
  initialStep?: ThemeWizardStep
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function ThemeFormDialog({
  open,
  id,
  initialStep = 1,
  onOpenChange,
  onSaved,
}: ThemeFormDialogProps) {
  const dispatch = useAppDispatch()
  const isNew = !id
  const title = isNew ? 'Create theme' : 'Edit theme'
  const finalSubmitLabel = isNew ? 'Create theme' : 'Save'
  const descriptions = isNew ? STEP_DESCRIPTIONS_CREATE : STEP_DESCRIPTIONS_EDIT

  const themes = useAppSelector((s) => s.systemTheme.themes)
  const status = useAppSelector((s) => s.systemTheme.status)
  const error = useAppSelector((s) => s.systemTheme.error)
  const preferences = useAppSelector((s) => s.systemTheme.preferences)
  const themesFetchedAt = useAppSelector((s) => s.systemTheme.themesFetchedAt)

  const themeForForm = !isNew && id ? (themes.find((t) => t.id === id) ?? null) : null
  const showLoading = Boolean(!isNew && !themeForForm && status === 'loading')
  const saving = status === 'saving'

  const [step, setStep] = useState<ThemeWizardStep>(initialStep)
  const [values, setValues] = useState<ThemeFormValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ThemeFormValues, string>>>(
    {},
  )
  const [importOpen, setImportOpen] = useState(false)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const submittedRef = useRef(false)
  const seededThemeIdRef = useRef<string | null>(null)
  const blockTimerRef = useRef<number | null>(null)
  const importOpenRef = useRef(false)

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    importOpenRef.current = importOpen
  }, [importOpen])

  useEffect(() => {
    if (!open) return
    setStep(initialStep)
    setFieldErrors({})
    seededThemeIdRef.current = null
    submittedRef.current = false
    importOpenRef.current = false
    setImportOpen(false)
    setBlockOuterDismiss(false)
    dispatch(systemThemeActions.clearError())
    if (isNew) {
      setValues(emptyValues())
    }
  }, [open, initialStep, isNew, dispatch])

  useEffect(() => {
    if (!open || isNew || !id) return
    if (themeForForm) return
    dispatch(systemThemeActions.loadThemesRequested({ force: themesFetchedAt !== null }))
  }, [open, isNew, id, themeForForm, themesFetchedAt, dispatch])

  useEffect(() => {
    if (!open || isNew || !themeForForm) return
    if (seededThemeIdRef.current === themeForForm.id) return
    seededThemeIdRef.current = themeForForm.id
    setValues(valuesFromTheme(themeForForm))
  }, [themeForForm, isNew, open])

  useEffect(() => {
    if (!submittedRef.current) return
    if (saving) return

    if (error) {
      submittedRef.current = false
      return
    }

    if (status === 'idle') {
      submittedRef.current = false
      onSaved?.()
      onOpenChange(false)
    }
  }, [saving, error, status, onSaved, onOpenChange])

  function patchValues(patch: Partial<ThemeFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  const handleImportOpenChange = useCallback((next: boolean) => {
    if (!next) {
      setBlockOuterDismiss(true)
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
      blockTimerRef.current = window.setTimeout(() => {
        setBlockOuterDismiss(false)
        blockTimerRef.current = null
      }, 150)
    }
    importOpenRef.current = next
    setImportOpen(next)
  }, [])

  function handleImport(colors: ParsedThemeColors) {
    patchValues({
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.surface,
      text: colors.text,
    })
    setFieldErrors({})
  }

  function validateStep(current: ThemeWizardStep): boolean {
    if (current === 1) {
      const result = themeBasicsSchema.safeParse({ name: values.name })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 2) {
      const result = themePaletteSchema.safeParse({
        primary: values.primary,
        secondary: values.secondary,
        background: values.background,
        surface: values.surface,
        text: values.text,
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    setStep((prev) => Math.min(prev + 1, THEME_WIZARD_TOTAL_STEPS) as ThemeWizardStep)
  }

  function handlePrevious() {
    setFieldErrors({})
    setStep((prev) => Math.max(prev - 1, 1) as ThemeWizardStep)
  }

  function handleSubmit() {
    for (const s of [1, 2] as const) {
      if (!validateStep(s)) {
        setStep(s)
        return
      }
    }

    const parsed = themeFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    submittedRef.current = true

    if (isNew) {
      dispatch(systemThemeActions.createThemeRequested(parsed.data))
      return
    }

    if (!id) return
    dispatch(systemThemeActions.updateThemeRequested({ id, values: parsed.data }))
  }

  function handleOpenChange(next: boolean) {
    if (!next && (importOpenRef.current || blockOuterDismiss)) {
      if (importOpenRef.current) {
        importOpenRef.current = false
        setImportOpen(false)
      }
      return
    }
    onOpenChange(next)
  }

  const stepIndex = step - 1
  const colorMode = preferences?.colorMode ?? 'light'

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={
        <>
          {descriptions[stepIndex]}{' '}
          {step === 2 ? (
            <>
              See{' '}
              <a
                href="https://ccolorpalette.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                CColorPalette
              </a>
              .
            </>
          ) : null}
        </>
      }
      sizeWidth="xlarge"
      sizeHeight="large"
      nestedDismissGuard={importOpen || blockOuterDismiss}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4"
              onClick={handlePrevious}
              disabled={saving || showLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          ) : null}
          {step < THEME_WIZARD_TOTAL_STEPS ? (
            <Button
              type="button"
              className="h-10 px-4"
              onClick={handleNext}
              disabled={saving || showLoading}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10"
              onClick={handleSubmit}
              disabled={saving || showLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? (isNew ? 'Creating…' : 'Saving…') : finalSubmitLabel}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {step} of {THEME_WIZARD_TOTAL_STEPS} — {STEP_TITLES[stepIndex]}
          </p>
          <ThemeWizardProgress currentStep={step} totalSteps={THEME_WIZARD_TOTAL_STEPS} />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {showLoading ? <p className="text-sm text-muted-foreground">Loading theme…</p> : null}

        {!showLoading && step === 1 ? (
          <ThemeWizardStepBasics
            values={values}
            fieldErrors={fieldErrors}
            isSubmitting={saving}
            onChange={patchValues}
          />
        ) : null}

        {!showLoading && step === 2 ? (
          <ThemeWizardStepPalette
            values={values}
            fieldErrors={fieldErrors}
            isSubmitting={saving}
            onChange={patchValues}
            onOpenImport={() => handleImportOpenChange(true)}
          />
        ) : null}

        {!showLoading && step === 3 ? (
          <ThemeWizardStepSummary values={values} colorMode={colorMode} isNew={isNew} />
        ) : null}
      </div>

      <ThemeCssImportDialog
        open={importOpen}
        onOpenChange={handleImportOpenChange}
        onImport={handleImport}
      />
    </CustomDialog>
  )
}
