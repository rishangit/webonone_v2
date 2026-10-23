import { z } from 'zod'
import { parseGoogleFontFamily } from '../utils/parseGoogleFontFamily'

const breakpointSizeSchema = z
  .number({ invalid_type_error: 'Size is required' })
  .min(8, 'Size must be at least 8')
  .max(200, 'Size must be at most 200')

export const createFontLibrarySchema = z
  .object({
    name: z.string().trim().min(1, 'Style name is required').max(128),
    googleFontUrl: z.string().trim().min(1, 'Google Font URL is required').max(2048),
    family: z.string().trim().min(1, 'Font family is required').max(255),
    publishStatus: z.enum(['draft', 'published']).optional(),
  })
  .superRefine((font, ctx) => {
    if (font.googleFontUrl && !parseGoogleFontFamily(font.googleFontUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid Google Font URL',
        path: ['googleFontUrl'],
      })
    }
  })

export const websiteFontTokenSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1, 'Style name is required').max(128),
    googleFontUrl: z.string().trim().min(1, 'Google Font URL is required').max(2048),
    family: z.string().trim().min(1, 'Font family is required').max(255),
    sourceLibraryId: z.string().min(1).max(64).nullable().optional(),
  })
  .superRefine((font, ctx) => {
    if (font.googleFontUrl && !parseGoogleFontFamily(font.googleFontUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid Google Font URL',
        path: ['googleFontUrl'],
      })
    }
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
  name: z.string().trim().min(1, 'Palette name is required').max(128),
  palette: websiteColorLibraryPaletteSchema,
  publishStatus: z.enum(['draft', 'published']).optional(),
})

export const websiteElementCustomizationSchema = z.object({
  html: z.string().max(50000).optional().default(''),
  styles: z.string().max(50000).optional().default(''),
  scripts: z.string().max(50000).optional().default(''),
})

const textLibraryDefinitionSchema = z.object({
  fontName: z.string().trim().min(1).max(128),
  googleFontUrl: z.string().trim().min(1).max(2048),
  family: z.string().trim().min(1).max(255),
  colorName: z.string().trim().min(1).max(128),
  colorValue: z.string().trim().min(1).max(32),
  size: z.number().min(8).max(200),
  sizeByBreakpoint: z
    .object({
      sm: breakpointSizeSchema.optional(),
      md: breakpointSizeSchema.optional(),
      lg: breakpointSizeSchema.optional(),
      xl: breakpointSizeSchema.optional(),
      '2xl': breakpointSizeSchema.optional(),
    })
    .optional(),
  customization: websiteElementCustomizationSchema.optional(),
})

export const createTextLibrarySchema = z.object({
  name: z.string().trim().min(1, 'Text style name is required').max(128),
  definition: textLibraryDefinitionSchema,
  publishStatus: z.enum(['draft', 'published']).optional(),
})

const buttonLibraryDefinitionSchema = z.object({
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
  name: z.string().trim().min(1, 'Button style name is required').max(128),
  definition: buttonLibraryDefinitionSchema,
  publishStatus: z.enum(['draft', 'published']).optional(),
})

export const websiteColorTokenSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, 'Color name is required').max(128),
  value: z.string().trim().min(1, 'Color value is required').max(32),
})

const themeColorIndexSchema = z.number().int().min(1).max(6)
const themePaletteIndexSchema = z.number().int().min(1).max(24)

const themePaletteColorSchema = z.object({
  name: z.string().trim().min(1, 'Color name is required').max(128),
  value: z.string().trim().min(1, 'Color value is required').max(32),
})

export const websiteThemeColorPaletteSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, 'Palette name is required').max(128),
  sourceLibraryPaletteId: z.string().min(1).max(64).nullable().optional(),
  colors: z.array(themePaletteColorSchema).min(1).max(6),
})

export const websiteTextStyleSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, 'Text style name is required').max(128),
  fontId: z.string().max(64).default(''),
  size: breakpointSizeSchema.default(16),
  sizeByBreakpoint: z
    .object({
      sm: breakpointSizeSchema.optional(),
      md: breakpointSizeSchema.optional(),
      lg: breakpointSizeSchema.optional(),
      xl: breakpointSizeSchema.optional(),
      '2xl': breakpointSizeSchema.optional(),
    })
    .optional(),
  colorIndex: themeColorIndexSchema.nullable().default(1),
  colorPaletteId: z.string().min(1).max(64).nullable().optional(),
  fontColorPaletteId: z.string().min(1).max(64).nullable().optional(),
  sourceLibraryId: z.string().min(1).max(64).nullable().optional(),
  customization: websiteElementCustomizationSchema.optional(),
})

export const websiteButtonStyleSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, 'Button name is required').max(128),
  colorPaletteId: z.string().min(1).max(64).nullable().optional(),
  backgroundColorPaletteId: z.string().min(1).max(64).nullable().optional(),
  textColorPaletteId: z.string().min(1).max(64).nullable().optional(),
  borderColorPaletteId: z.string().min(1).max(64).nullable().optional(),
  backgroundColorIndex: themeColorIndexSchema.nullable().default(1),
  textColorIndex: themeColorIndexSchema.nullable().default(1),
  textStyleId: z.string().max(64).default(''),
  borderColorIndex: themeColorIndexSchema.nullable().default(1),
  borderWidth: z.number().min(0).max(16).default(0),
  radius: z.number({ invalid_type_error: 'Border radius is required' }).min(0).max(999).default(6),
  sourceLibraryId: z.string().min(1).max(64).nullable().optional(),
  customization: websiteElementCustomizationSchema.optional(),
})

export const websiteThemeEditorSchema = z.object({
  name: z.string().trim().min(1, 'Theme name is required').max(255),
  colorPaletteId: z.string().max(64),
  pageBackgroundPaletteIndex: themePaletteIndexSchema.nullable().optional(),
  surfacePaletteIndex: themePaletteIndexSchema.nullable().optional(),
  bodyTextPaletteIndex: themePaletteIndexSchema.nullable().optional(),
  accent1PaletteIndex: themePaletteIndexSchema.nullable().optional(),
  accent2PaletteIndex: themePaletteIndexSchema.nullable().optional(),
  pageBackgroundIndex: themeColorIndexSchema.nullable(),
  surfaceIndex: themeColorIndexSchema.nullable(),
  bodyTextIndex: themeColorIndexSchema.nullable(),
  accent1Index: themeColorIndexSchema.nullable(),
  accent2Index: themeColorIndexSchema.nullable(),
  fonts: z.array(websiteFontTokenSchema).max(40),
  colorPalettes: z.array(websiteThemeColorPaletteSchema).max(24),
  textStyles: z.array(websiteTextStyleSchema).max(40),
  buttonStyles: z.array(websiteButtonStyleSchema).max(40),
})

export type WebsiteThemeEditorValues = z.infer<typeof websiteThemeEditorSchema>
