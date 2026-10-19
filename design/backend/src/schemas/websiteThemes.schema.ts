import { z } from 'zod'

export const createFontLibrarySchema = z.object({
  name: z.string().trim().min(1).max(128),
  googleFontUrl: z.string().trim().min(1).max(2048),
  family: z.string().trim().min(1).max(255),
})

const colorLibraryPaletteHex = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color (#RRGGBB)')

const websiteColorLibraryColorSchema = z.object({
  name: z.string().trim().min(1, 'Color name is required').max(128),
  value: colorLibraryPaletteHex,
})

export const websiteColorLibraryPaletteSchema = z.object({
  colors: z
    .array(websiteColorLibraryColorSchema)
    .min(1, 'Add at least one color')
    .max(6, 'A palette can have at most six colors'),
})

export const createColorLibrarySchema = z.object({
  name: z.string().trim().min(1).max(128),
  palette: websiteColorLibraryPaletteSchema,
})

export const websiteElementCustomizationSchema = z.object({
  html: z.string().max(50000).optional().default(''),
  styles: z.string().max(50000).optional().default(''),
  scripts: z.string().max(50000).optional().default(''),
})

export const textLibraryDefinitionSchema = z.object({
  fontName: z.string().trim().min(1).max(128),
  googleFontUrl: z.string().trim().min(1).max(2048),
  family: z.string().trim().min(1).max(255),
  colorName: z.string().trim().min(1).max(128),
  colorValue: z.string().trim().min(1).max(32),
  size: z.number().min(8).max(200),
  sizeByBreakpoint: z
    .object({
      sm: z.number().min(8).max(200).optional(),
      md: z.number().min(8).max(200).optional(),
      lg: z.number().min(8).max(200).optional(),
      xl: z.number().min(8).max(200).optional(),
      '2xl': z.number().min(8).max(200).optional(),
    })
    .optional(),
  customization: websiteElementCustomizationSchema.optional(),
})

export const createTextLibrarySchema = z.object({
  name: z.string().trim().min(1).max(128),
  definition: textLibraryDefinitionSchema,
})

export const buttonLibraryDefinitionSchema = z.object({
  backgroundColorName: z.string().trim().min(1).max(128),
  backgroundColorValue: z.string().trim().min(1).max(32),
  textColorName: z.string().trim().min(1).max(128),
  textColorValue: z.string().trim().min(1).max(32),
  borderColorName: z.string().trim().min(1).max(128),
  borderColorValue: z.string().trim().min(1).max(32),
  borderWidth: z.number().min(0).max(16),
  radius: z.number().min(0).max(999),
  textStyleName: z.string().trim().min(1).max(128),
  textFontName: z.string().trim().min(1).max(128),
  textGoogleFontUrl: z.string().trim().min(1).max(2048),
  textFontFamily: z.string().trim().min(1).max(255),
  textSize: z.number().min(8).max(200),
  labelColorName: z.string().trim().min(1).max(128),
  labelColorValue: z.string().trim().min(1).max(32),
  customization: websiteElementCustomizationSchema.optional(),
})

export const createButtonLibrarySchema = z.object({
  name: z.string().trim().min(1).max(128),
  definition: buttonLibraryDefinitionSchema,
})

function codeField() {
  return z.preprocess((value) => {
    if (value == null) return undefined
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join('\n')
    }
    return value
  }, z.string().max(50000).optional())
}

function jsonObject<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      return value
    }
  }, schema)
}

const elementLibraryPatchFields = {
  html: codeField(),
  styles: codeField(),
  scripts: codeField(),
}

function hasElementLibraryPatch(
  data: { name?: string; definition?: unknown; html?: string; styles?: string; scripts?: string },
): boolean {
  return (
    data.name != null ||
    data.definition != null ||
    data.html != null ||
    data.styles != null ||
    data.scripts != null
  )
}

const buttonLibraryDefinitionPatchSchema = buttonLibraryDefinitionSchema.extend({
  borderWidth: z.coerce.number().min(0).max(16),
  radius: z.coerce.number().min(0).max(999),
  textSize: z.coerce.number().min(8).max(200),
}).partial()

const textLibraryDefinitionPatchSchema = textLibraryDefinitionSchema.extend({
  size: z.coerce.number().min(8).max(200),
}).partial()

export const updateButtonLibraryElementSchema = z
  .object({
    name: z.string().trim().min(1).max(128).optional(),
    definition: jsonObject(buttonLibraryDefinitionPatchSchema).optional(),
    ...elementLibraryPatchFields,
  })
  .refine(hasElementLibraryPatch, {
    message: 'Send at least one of name, definition, html, styles, or scripts',
  })

export const updateTextLibraryElementSchema = z
  .object({
    name: z.string().trim().min(1).max(128).optional(),
    definition: jsonObject(textLibraryDefinitionPatchSchema).optional(),
    ...elementLibraryPatchFields,
  })
  .refine(hasElementLibraryPatch, {
    message: 'Send at least one of name, definition, html, styles, or scripts',
  })

export const websiteFontTokenSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  googleFontUrl: z.string().max(2048).default(''),
  family: z.string().trim().min(1).max(255),
})

export const websiteColorTokenSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  value: z.string().trim().min(1).max(32),
})

export const websiteThemeColorPaletteSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  sourceLibraryPaletteId: z.string().min(1).max(64).nullable().optional(),
  colorIds: z.array(z.string().min(1).max(64)).max(80),
})

export const websiteTextStyleSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  fontId: z.string().max(64).default(''),
  size: z.number().min(8).max(200).default(16),
  sizeByBreakpoint: z
    .object({
      sm: z.number().min(8).max(200).optional(),
      md: z.number().min(8).max(200).optional(),
      lg: z.number().min(8).max(200).optional(),
      xl: z.number().min(8).max(200).optional(),
      '2xl': z.number().min(8).max(200).optional(),
    })
    .optional(),
  colorId: z.string().max(64).default(''),
  sourceLibraryId: z.string().min(1).max(64).nullable().optional(),
  customization: websiteElementCustomizationSchema.optional(),
})

export const websiteButtonStyleSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  backgroundColorId: z.string().max(64).default(''),
  textColorId: z.string().max(64).default(''),
  textStyleId: z.string().max(64).default(''),
  borderColorId: z.string().max(64).default(''),
  borderWidth: z.number().min(0).max(16).default(0),
  radius: z.number().min(0).max(999).default(6),
  sourceLibraryId: z.string().min(1).max(64).nullable().optional(),
  customization: websiteElementCustomizationSchema.optional(),
})

export const websiteThemeColorRolesSchema = z.object({
  pageBackgroundColorId: z.string().max(64).optional().default(''),
  surfaceColorId: z.string().max(64).optional().default(''),
  bodyTextColorId: z.string().max(64).optional().default(''),
  accentColor1Id: z.string().max(64).optional().default(''),
  accentColor2Id: z.string().max(64).optional().default(''),
})

export const createWebsiteThemeSchema = z.object({
  name: z.string().trim().min(1).max(255),
  pageBackground: z.string().max(32).optional().default('#ffffff'),
  bodyTextColor: z.string().max(32).optional().default('#111827'),
  colorRoles: websiteThemeColorRolesSchema.optional(),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  fonts: z.array(websiteFontTokenSchema).max(40).optional().default([]),
  colors: z.array(websiteColorTokenSchema).max(80).optional().default([]),
  colorPalettes: z.array(websiteThemeColorPaletteSchema).max(24).optional().default([]),
  textStyles: z.array(websiteTextStyleSchema).max(40).optional().default([]),
  buttonStyles: z.array(websiteButtonStyleSchema).max(40).optional().default([]),
})

export const updateWebsiteThemeSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    pageBackground: z.string().max(32).optional(),
    bodyTextColor: z.string().max(32).optional(),
    colorRoles: websiteThemeColorRolesSchema.optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    fonts: z.array(websiteFontTokenSchema).max(40).optional(),
    colors: z.array(websiteColorTokenSchema).max(80).optional(),
    colorPalettes: z.array(websiteThemeColorPaletteSchema).max(24).optional(),
    textStyles: z.array(websiteTextStyleSchema).max(40).optional(),
    buttonStyles: z.array(websiteButtonStyleSchema).max(40).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type WebsiteFontToken = z.infer<typeof websiteFontTokenSchema>
export type WebsiteColorToken = z.infer<typeof websiteColorTokenSchema>
export type WebsiteThemeColorPalette = z.infer<typeof websiteThemeColorPaletteSchema>
export type WebsiteThemeColorRoles = z.infer<typeof websiteThemeColorRolesSchema>
export type WebsiteTextStyle = z.infer<typeof websiteTextStyleSchema>
export type WebsiteButtonStyle = z.infer<typeof websiteButtonStyleSchema>
export type CreateWebsiteThemeBody = z.infer<typeof createWebsiteThemeSchema>
export type UpdateWebsiteThemeBody = z.infer<typeof updateWebsiteThemeSchema>
