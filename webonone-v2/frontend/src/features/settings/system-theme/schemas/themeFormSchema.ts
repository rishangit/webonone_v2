import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use #RRGGBB format')

export const themeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color1: hexColor,
  color2: hexColor,
  color3: hexColor,
  color4: hexColor,
  color5: hexColor,
})

export type ThemeFormValues = z.infer<typeof themeFormSchema>
