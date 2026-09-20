import { z } from 'zod'
import { parseGoogleFontFamily } from '../utils/parseGoogleFontFamily'

const breakpointSizeSchema = z
  .number({ invalid_type_error: 'Size is required' })
  .min(8, 'Size must be at least 8')
  .max(200, 'Size must be at most 200')

export const websiteFontTokenSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1, 'Style name is required').max(128),
    googleFontUrl: z.string().trim().min(1, 'Google Font URL is required').max(2048),
    family: z.string().trim().min(1, 'Font family is required').max(255),
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

export const websiteColorTokenSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, 'Color name is required').max(128),
  value: z.string().trim().min(1, 'Color value is required').max(32),
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
  colorId: z.string().max(64).default(''),
})

export const websiteButtonStyleSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, 'Button name is required').max(128),
  backgroundColorId: z.string().max(64).default(''),
  textColorId: z.string().max(64).default(''),
  textStyleId: z.string().max(64).default(''),
  borderColorId: z.string().max(64).default(''),
  borderWidth: z.number().min(0).max(16).default(0),
  radius: z.number({ invalid_type_error: 'Border radius is required' }).min(0).max(999).default(6),
})

export const websiteThemeEditorSchema = z.object({
  name: z.string().trim().min(1, 'Theme name is required').max(255),
  pageBackground: z.string().max(32),
  bodyTextColor: z.string().max(32),
  fonts: z.array(websiteFontTokenSchema).max(40),
  colors: z.array(websiteColorTokenSchema).max(80),
  textStyles: z.array(websiteTextStyleSchema).max(40),
  buttonStyles: z.array(websiteButtonStyleSchema).max(40),
})

export type WebsiteThemeEditorValues = z.infer<typeof websiteThemeEditorSchema>
