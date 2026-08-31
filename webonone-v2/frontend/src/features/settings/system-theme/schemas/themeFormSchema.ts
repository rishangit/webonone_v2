import { z } from 'zod'
import { platformDefaultFormValues } from '../constants/defaultThemeFormValues'

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use #RRGGBB format')

export const THEME_WIZARD_TOTAL_STEPS = 3 as const

export type ThemeWizardStep = 1 | 2 | 3

export function parseThemeWizardStep(raw: string | null | undefined): ThemeWizardStep {
  const n = Number(raw)
  if (n === 2 || n === 3) return n
  return 1
}

export const themeBasicsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export const themePaletteSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  background: hexColor,
  surface: hexColor,
  text: hexColor,
})

export const themeFormSchema = themeBasicsSchema.merge(themePaletteSchema)

export type ThemeFormValues = z.infer<typeof themeFormSchema>

export const EMPTY_THEME_WIZARD_VALUES: ThemeFormValues = {
  name: '',
  primary: platformDefaultFormValues.primary,
  secondary: platformDefaultFormValues.secondary,
  background: platformDefaultFormValues.background,
  surface: platformDefaultFormValues.surface,
  text: platformDefaultFormValues.text,
}
