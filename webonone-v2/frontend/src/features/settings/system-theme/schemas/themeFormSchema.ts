import { z } from 'zod'

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
  color1: hexColor,
  color2: hexColor,
  color3: hexColor,
  color4: hexColor,
  color5: hexColor,
})

export const themeFormSchema = themeBasicsSchema.merge(themePaletteSchema)

export type ThemeFormValues = z.infer<typeof themeFormSchema>

export const EMPTY_THEME_WIZARD_VALUES: ThemeFormValues = {
  name: '',
  color1: '#344CE2',
  color2: '#3578E8',
  color3: '#3578E8',
  color4: '#EFF3FA',
  color5: '#0E2F59',
}
