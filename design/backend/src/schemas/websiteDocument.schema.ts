import { z } from 'zod'

export const websiteBreakpoints = ['sm', 'md', 'lg', 'xl', '2xl'] as const
export type WebsiteBreakpoint = (typeof websiteBreakpoints)[number]

export const websiteBreakpointSchema = z.enum(websiteBreakpoints)

export const layoutRectSchema = z.object({
  col: z.number().int().min(1).max(12),
  colSpan: z.number().int().min(1).max(12),
  top: z.number().min(0).max(20000),
  height: z.number().min(8).max(20000),
})

export const layoutByBreakpointSchema = z
  .object({
    sm: layoutRectSchema.optional(),
    md: layoutRectSchema.optional(),
    lg: layoutRectSchema.optional(),
    xl: layoutRectSchema.optional(),
    '2xl': layoutRectSchema,
  })
  .superRefine((layout, ctx) => {
    for (const key of websiteBreakpoints) {
      const rect = layout[key]
      if (!rect) continue
      if (rect.col + rect.colSpan - 1 > 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Column span exceeds the 12-column grid',
          path: [key],
        })
      }
    }
  })

export const mediaRefSchema = z.object({
  fileId: z.string().min(1).max(64),
  url: z.string().min(1).max(2048),
})

export const imageAddonPropsSchema = z.object({
  mediaByBreakpoint: z
    .object({
      sm: mediaRefSchema.optional(),
      md: mediaRefSchema.optional(),
      lg: mediaRefSchema.optional(),
      xl: mediaRefSchema.optional(),
      '2xl': mediaRefSchema.optional(),
    })
    .default({}),
  fit: z.enum(['cover', 'contain']).default('cover'),
  heightMode: z.enum(['auto', 'fixed']).default('auto'),
  fixedHeight: z.number().min(8).max(4000).optional(),
})

export const textAddonSnapshotSchema = z.object({
  fontFamily: z.string().max(255).default('inherit'),
  googleFontUrl: z.string().max(2048).optional(),
  size: z.number().min(8).max(200).default(16),
  color: z.string().max(32).default('#111827'),
})

export const textAddonPropsSchema = z.object({
  textStyleId: z.string().max(64).default(''),
  content: z.string().max(20000).default(''),
  fontSizeByBreakpoint: z
    .object({
      sm: z.number().min(8).max(200).optional(),
      md: z.number().min(8).max(200).optional(),
      lg: z.number().min(8).max(200).optional(),
      xl: z.number().min(8).max(200).optional(),
      '2xl': z.number().min(8).max(200).optional(),
    })
    .optional(),
  snapshot: textAddonSnapshotSchema.default({}),
})

export const buttonAddonSnapshotSchema = z.object({
  background: z.string().max(32).default('#111827'),
  textColor: z.string().max(32).default('#ffffff'),
  borderColor: z.string().max(32).default('transparent'),
  borderWidth: z.number().min(0).max(16).default(0),
  radius: z.number().min(0).max(999).default(6),
  fontFamily: z.string().max(255).default('inherit'),
  googleFontUrl: z.string().max(2048).optional(),
  fontSize: z.number().min(8).max(200).default(16),
})

export const buttonAddonPropsSchema = z.object({
  buttonStyleId: z.string().max(64).default(''),
  label: z.string().max(255).default('Button'),
  linkPageId: z.string().max(21).nullable().optional(),
  snapshot: buttonAddonSnapshotSchema.default({}),
})

export const websiteAddonSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('image'),
    zIndex: z.number().int().default(0),
    layout: layoutByBreakpointSchema,
    props: imageAddonPropsSchema,
  }),
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('text'),
    zIndex: z.number().int().default(0),
    layout: layoutByBreakpointSchema,
    props: textAddonPropsSchema,
  }),
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('button'),
    zIndex: z.number().int().default(0),
    layout: layoutByBreakpointSchema,
    props: buttonAddonPropsSchema,
  }),
])

export const websiteBlockSchema = z.object({
  id: z.string().min(1).max(64),
  zIndex: z.number().int().default(0),
  backgroundColor: z.string().max(32).optional(),
  layout: layoutByBreakpointSchema,
  addons: z.array(websiteAddonSchema).max(80).default([]),
})

export const websiteDocumentSchema = z.object({
  version: z.literal(1),
  container: z.object({
    height: z.number().min(80).max(20000).default(640),
    backgroundColor: z.string().max(32).optional(),
  }),
  blocks: z.array(websiteBlockSchema).max(80).default([]),
})

export type LayoutRect = z.infer<typeof layoutRectSchema>
export type LayoutByBreakpoint = z.infer<typeof layoutByBreakpointSchema>
export type WebsiteAddon = z.infer<typeof websiteAddonSchema>
export type WebsiteBlock = z.infer<typeof websiteBlockSchema>
export type WebsiteDocumentV1 = z.infer<typeof websiteDocumentSchema>

export function emptyLayoutRect(overrides: Partial<LayoutRect> = {}): LayoutRect {
  return {
    col: 1,
    colSpan: 12,
    top: 16,
    height: 160,
    ...overrides,
  }
}

export function emptyLayoutByBreakpoint(rect?: Partial<LayoutRect>): LayoutByBreakpoint {
  return { '2xl': emptyLayoutRect(rect) }
}

export function emptyWebsiteDocument(): WebsiteDocumentV1 {
  return {
    version: 1,
    container: { height: 640 },
    blocks: [],
  }
}
