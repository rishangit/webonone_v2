import { z } from 'zod'

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
})

export const createWebsiteThemeSchema = z.object({
  name: z.string().trim().min(1).max(255),
  pageBackground: z.string().max(32).optional().default('#ffffff'),
  bodyTextColor: z.string().max(32).optional().default('#111827'),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  fonts: z.array(websiteFontTokenSchema).max(40).optional().default([]),
  colors: z.array(websiteColorTokenSchema).max(80).optional().default([]),
  textStyles: z.array(websiteTextStyleSchema).max(40).optional().default([]),
  buttonStyles: z.array(websiteButtonStyleSchema).max(40).optional().default([]),
})

export const updateWebsiteThemeSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    pageBackground: z.string().max(32).optional(),
    bodyTextColor: z.string().max(32).optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    fonts: z.array(websiteFontTokenSchema).max(40).optional(),
    colors: z.array(websiteColorTokenSchema).max(80).optional(),
    textStyles: z.array(websiteTextStyleSchema).max(40).optional(),
    buttonStyles: z.array(websiteButtonStyleSchema).max(40).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type WebsiteFontToken = z.infer<typeof websiteFontTokenSchema>
export type WebsiteColorToken = z.infer<typeof websiteColorTokenSchema>
export type WebsiteTextStyle = z.infer<typeof websiteTextStyleSchema>
export type WebsiteButtonStyle = z.infer<typeof websiteButtonStyleSchema>
export type CreateWebsiteThemeBody = z.infer<typeof createWebsiteThemeSchema>
export type UpdateWebsiteThemeBody = z.infer<typeof updateWebsiteThemeSchema>
