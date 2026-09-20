import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  Muted,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import {
  THEME_COLOR_KEYS,
  THEME_COLOR_LABELS,
  platformDefaultFormValues,
} from '@/features/settings/system-theme/constants/themeDefaults'
import {
  EMPTY_THEME_WIZARD_VALUES,
  THEME_WIZARD_TOTAL_STEPS,
  mapZodIssuesToFieldErrors,
  themeBasicsSchema,
  themeFormSchema,
  themePaletteSchema,
  type ThemeFormValues,
  type ThemeWizardStep,
} from '@/features/settings/system-theme/schemas/themeSchemas'
import { themeApi } from '@/features/settings/system-theme/services/themeApi'
import { ThemeColorSwatches } from '@/features/settings/system-theme/components/ThemeColorSwatches'
import {
  themeFormFromApiTheme,
  themeFormToApiBody,
} from '@/features/settings/system-theme/utils/themeFormMapping'

const STEP_TITLES: Record<ThemeWizardStep, string> = {
  1: 'Basics',
  2: 'Palette',
  3: 'Summary',
}

const STEP_DESCRIPTIONS_CREATE: Record<ThemeWizardStep, string> = {
  1: 'Name your theme.',
  2: 'Define five palette colors for the platform shell.',
  3: 'Review your theme before creating it.',
}

const STEP_DESCRIPTIONS_EDIT: Record<ThemeWizardStep, string> = {
  1: 'Theme name.',
  2: 'Palette colors (primary, secondary, background, surface, text).',
  3: 'Review your changes before saving.',
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Muted>{label}</Muted>
      <Body className="font-medium">{value}</Body>
    </View>
  )
}

export function ThemeFormDialog({
  open,
  themeId,
  initialStep = 1,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  themeId?: string
  initialStep?: ThemeWizardStep
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { toast } = useToast()
  const isNew = !themeId
  const descriptions = isNew ? STEP_DESCRIPTIONS_CREATE : STEP_DESCRIPTIONS_EDIT
  const finalSubmitLabel = isNew ? 'Create theme' : 'Save'

  const [step, setStep] = useState<ThemeWizardStep>(initialStep)
  const [values, setValues] = useState<ThemeFormValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ThemeFormValues, string>>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(initialStep)
    setFieldErrors({})
    setLoadError(null)

    if (!themeId) {
      setValues(emptyValues())
      return
    }

    let active = true
    setLoading(true)
    void (async () => {
      try {
        const themes = await themeApi.listThemes()
        const theme = themes.find((item) => item.id === themeId)
        if (!theme) {
          throw new Error('Theme not found')
        }
        if (active) {
          setValues(themeFormFromApiTheme(theme))
        }
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load theme')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [open, themeId, initialStep])

  function validateStep(current: ThemeWizardStep): boolean {
    const schema =
      current === 1 ? themeBasicsSchema : current === 2 ? themePaletteSchema : themeFormSchema
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return false
    }
    setFieldErrors({})
    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    if (step < THEME_WIZARD_TOTAL_STEPS) {
      setStep((current) => (current + 1) as ThemeWizardStep)
    }
  }

  function handlePrevious() {
    if (step > 1) {
      setStep((current) => (current - 1) as ThemeWizardStep)
    }
  }

  async function handleSubmit() {
    const parsed = themeFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setSaving(true)
    try {
      const body = themeFormToApiBody(parsed.data)
      if (isNew) {
        await themeApi.createTheme(body)
        toast({ title: 'Theme created' })
      } else if (themeId) {
        await themeApi.updateTheme(themeId, body)
        toast({ title: 'Theme saved' })
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast({
        title: isNew ? 'Could not create theme' : 'Could not save theme',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function handlePrimaryAction() {
    if (step < THEME_WIZARD_TOTAL_STEPS) {
      handleNext()
      return
    }
    void handleSubmit()
  }

  const previewBody = themeFormToApiBody(values)

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${isNew ? 'Create' : 'Edit'} theme — ${STEP_TITLES[step]}`}
      description={`Step ${step} of ${THEME_WIZARD_TOTAL_STEPS}. ${descriptions[step]}`}
      sizeWidth="large"
      sizeHeight="xlarge"
      footer={
        <>
          {step > 1 ? (
            <Button variant="outline" disabled={saving || loading} onPress={handlePrevious}>
              Previous
            </Button>
          ) : (
            <Button variant="outline" disabled={saving || loading} onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button loading={saving} disabled={loading || saving || !!loadError} onPress={handlePrimaryAction}>
            {step < THEME_WIZARD_TOTAL_STEPS ? 'Next' : finalSubmitLabel}
          </Button>
        </>
      }
    >
      <Muted>
        Step {step} of {THEME_WIZARD_TOTAL_STEPS}
      </Muted>
      {loadError ? <Body className="text-destructive">{loadError}</Body> : null}
      {loading ? <Muted>Loading theme…</Muted> : null}

      {!loading && !loadError && step === 1 ? (
        <TextField
          label="Theme name"
          required
          value={values.name}
          onChangeText={(name) => setValues((current) => ({ ...current, name }))}
          error={fieldErrors.name}
          placeholder={platformDefaultFormValues.name}
        />
      ) : null}

      {!loading && !loadError && step === 2 ? (
        <View className="gap-3">
          {THEME_COLOR_KEYS.map((key) => (
            <TextField
              key={key}
              label={THEME_COLOR_LABELS[key]}
              required
              value={values[key]}
              onChangeText={(color) => setValues((current) => ({ ...current, [key]: color }))}
              error={fieldErrors[key]}
              placeholder="#RRGGBB"
              autoCapitalize="characters"
            />
          ))}
        </View>
      ) : null}

      {!loading && !loadError && step === 3 ? (
        <View className="gap-4">
          <SummaryRow label="Name" value={values.name.trim() || '—'} />
          <View className="gap-2">
            <Muted>Palette</Muted>
            <ThemeColorSwatches theme={previewBody} />
          </View>
          {THEME_COLOR_KEYS.map((key) => (
            <SummaryRow key={key} label={THEME_COLOR_LABELS[key]} value={values[key]} />
          ))}
        </View>
      ) : null}
    </CustomDialog>
  )
}
