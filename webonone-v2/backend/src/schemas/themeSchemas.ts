import { z } from 'zod'

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')

export const createThemeBodySchema = z.object({
  name: z.string().min(1).max(100),
  color1: hexColorSchema,
  color2: hexColorSchema,
  color3: hexColorSchema,
  color4: hexColorSchema,
  color5: hexColorSchema,
})

export const updateThemeBodySchema = createThemeBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' })

export const listPageModeSchema = z.enum(['pagination', 'on-scroll'])

export const uiThemeSchema = z.enum(['classic', 'high-tech'])

export const patchPreferencesBodySchema = z
  .object({
    activeThemeId: z.string().length(21).optional(),
    colorMode: z.enum(['light', 'dark']).optional(),
    listPageMode: listPageModeSchema.optional(),
    uiTheme: uiThemeSchema.optional(),
  })
  .refine(
    (data) =>
      data.activeThemeId !== undefined ||
      data.colorMode !== undefined ||
      data.listPageMode !== undefined ||
      data.uiTheme !== undefined,
    {
      message: 'At least one field is required',
    },
  )

export type CreateThemeBody = z.infer<typeof createThemeBodySchema>
export type UpdateThemeBody = z.infer<typeof updateThemeBodySchema>
export type PatchPreferencesBody = z.infer<typeof patchPreferencesBodySchema>
