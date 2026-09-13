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
  fileName: z.string().max(255).optional(),
  mimeType: z.string().max(128).optional(),
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

export const MAX_SLIDER_DATA_ITEMS = 48

export const menuDisplayModeSchema = z.enum(['inline', 'hamburger', 'wrap', 'scroll'])

export const menuBreakpointSettingsSchema = z.object({
  mode: menuDisplayModeSchema.default('inline'),
  align: z.enum(['start', 'center', 'end']).default('start'),
  panelSide: z.enum(['left', 'right']).optional(),
})

export const menuSubItemSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(120).default(''),
  textStyleId: z.string().max(64).default(''),
  linkPageId: z.string().max(21).nullable().default(null),
  children: z.tuple([]).default([]),
})

export const menuItemSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(120).default(''),
  textStyleId: z.string().max(64).default(''),
  linkPageId: z.string().max(21).nullable().default(null),
  children: z.array(menuSubItemSchema).max(12).default([]),
})

export const menuAddonPropsSchema = z.object({
  displayByBreakpoint: z
    .object({
      sm: menuBreakpointSettingsSchema.optional(),
      md: menuBreakpointSettingsSchema.optional(),
      lg: menuBreakpointSettingsSchema.optional(),
      xl: menuBreakpointSettingsSchema.optional(),
      '2xl': menuBreakpointSettingsSchema.optional(),
    })
    .default({}),
  items: z.array(menuItemSchema).max(20).default([]),
})

export const addonDataBindingSchema = z
  .object({
    fields: z.record(z.string().max(64), z.string().max(128)).default({}),
  })
  .optional()

export const blockDataBindingSchema = z
  .object({
    datasetId: z.string().max(21).nullable().default(null),
    itemGroup: z.string().max(64).nullable().optional(),
    itemGap: z.number().min(0).max(2000).optional(),
    /** Path on an inherited parent row passed into this block (object or array). */
    itemsPath: z.string().max(128).nullable().optional(),
  })
  .optional()

export const elementBorderRadiusSchema = z.enum(['sm', 'md', 'lg', 'xl', 'full'])
export const elementBoxShadowSchema = z.enum(['sm', 'md', 'lg'])
export const elementPaddingSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export const elementMarginSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])

export const elementChromeFields = {
  backgroundColor: z.string().max(32).optional(),
  borderColor: z.string().max(32).optional(),
  borderRadius: elementBorderRadiusSchema.optional(),
  boxShadow: elementBoxShadowSchema.optional(),
  padding: elementPaddingSchema.optional(),
  margin: elementMarginSchema.optional(),
}

export type ElementChrome = {
  backgroundColor?: string
  borderColor?: string
  borderRadius?: z.infer<typeof elementBorderRadiusSchema>
  boxShadow?: z.infer<typeof elementBoxShadowSchema>
  padding?: z.infer<typeof elementPaddingSchema>
  margin?: z.infer<typeof elementMarginSchema>
}

const addonBaseFields = {
  id: z.string().min(1).max(64),
  zIndex: z.number().int().default(0),
  layout: layoutByBreakpointSchema,
  dataBinding: addonDataBindingSchema,
  ...elementChromeFields,
}

export const MAX_BLOCK_TREE_DEPTH = 8
export const MAX_BLOCK_CHILDREN = 40
export const MAX_ROOT_BLOCKS = 80
export const MAX_TOTAL_BLOCKS = 200

export type SliderManualSlide = {
  id: string
  data: Record<string, unknown>
}

export type SliderDisplaySettings = {
  itemsPerView: number
  showNavigation: boolean
  autoSlide: boolean
}

export type SliderAddonProps = {
  slideTemplate: WebsiteBlock | null
  sourcePresetId?: string | null
  dataSource: 'dataset' | 'manual' | 'parent'
  datasetId: string | null
  /** Direct child `groupName` under the slide shell that repeats per data row. */
  itemGroup?: string | null
  /** When dataSource is `parent`, path on the ambient parent row for slide items. */
  itemsPath?: string | null
  manualSlides: SliderManualSlide[]
  displayByBreakpoint?: Partial<
    Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', SliderDisplaySettings>
  >
  /** @deprecated Prefer displayByBreakpoint. */
  showNavigation?: boolean
  /** @deprecated Prefer displayByBreakpoint. */
  autoSlide?: boolean
  /** @deprecated Prefer displayByBreakpoint. */
  itemsPerView?: number
}

type WebsiteAddonBase = {
  id: string
  zIndex: number
  layout: z.infer<typeof layoutByBreakpointSchema>
  dataBinding?: z.infer<typeof addonDataBindingSchema>
} & ElementChrome

export type WebsiteAddon =
  | (WebsiteAddonBase & {
      type: 'image'
      props: z.infer<typeof imageAddonPropsSchema>
    })
  | (WebsiteAddonBase & {
      type: 'text'
      props: z.infer<typeof textAddonPropsSchema>
    })
  | (WebsiteAddonBase & {
      type: 'button'
      props: z.infer<typeof buttonAddonPropsSchema>
    })
  | (WebsiteAddonBase & {
      type: 'slider'
      props: SliderAddonProps
    })
  | (WebsiteAddonBase & {
      type: 'menu'
      props: z.infer<typeof menuAddonPropsSchema>
    })

export type WebsiteBlock = {
  id: string
  zIndex: number
  groupName?: string
  dataBinding?: {
    datasetId: string | null
    itemGroup?: string | null
    itemGap?: number
    itemsPath?: string | null
  }
  layout: z.infer<typeof layoutByBreakpointSchema>
  addons: WebsiteAddon[]
  children: WebsiteBlock[]
} & ElementChrome

export const websiteBlockSchema: z.ZodType<WebsiteBlock> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(64),
    zIndex: z.number().int().default(0),
    ...elementChromeFields,
    groupName: z.string().trim().max(64).optional(),
    dataBinding: blockDataBindingSchema,
    layout: layoutByBreakpointSchema,
    addons: z.array(websiteAddonSchema).max(80).default([]),
    children: z.array(websiteBlockSchema).max(MAX_BLOCK_CHILDREN).default([]),
  }),
) as z.ZodType<WebsiteBlock>

export const sliderDisplaySettingsSchema = z.object({
  itemsPerView: z.number().int().min(1).max(6).default(1),
  showNavigation: z.boolean().default(true),
  autoSlide: z.boolean().default(false),
})

export const sliderAddonPropsSchema: z.ZodType<SliderAddonProps> = z.lazy(() =>
  z.object({
    slideTemplate: websiteBlockSchema.nullable().default(null),
    sourcePresetId: z.string().max(21).nullable().optional(),
    dataSource: z.enum(['dataset', 'manual', 'parent']).default('manual'),
    datasetId: z.string().max(21).nullable().default(null),
    itemGroup: z.string().max(64).nullable().optional(),
    itemsPath: z.string().max(128).nullable().optional(),
    manualSlides: z
      .array(
        z.object({
          id: z.string().min(1).max(64),
          data: z.record(z.string().max(128), z.any()).default({}),
        }),
      )
      .max(MAX_SLIDER_DATA_ITEMS)
      .default([]),
    displayByBreakpoint: z
      .object({
        sm: sliderDisplaySettingsSchema.optional(),
        md: sliderDisplaySettingsSchema.optional(),
        lg: sliderDisplaySettingsSchema.optional(),
        xl: sliderDisplaySettingsSchema.optional(),
        '2xl': sliderDisplaySettingsSchema.optional(),
      })
      .optional()
      .default({}),
    // Legacy flat fields — still accepted for older documents.
    showNavigation: z.boolean().optional(),
    autoSlide: z.boolean().optional(),
    itemsPerView: z.number().int().min(1).max(6).optional(),
  }),
) as z.ZodType<SliderAddonProps>

export const websiteAddonSchema: z.ZodType<WebsiteAddon> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      ...addonBaseFields,
      type: z.literal('image'),
      props: imageAddonPropsSchema,
    }),
    z.object({
      ...addonBaseFields,
      type: z.literal('text'),
      props: textAddonPropsSchema,
    }),
    z.object({
      ...addonBaseFields,
      type: z.literal('button'),
      props: buttonAddonPropsSchema,
    }),
    z.object({
      ...addonBaseFields,
      type: z.literal('slider'),
      props: sliderAddonPropsSchema,
    }),
    z.object({
      ...addonBaseFields,
      type: z.literal('menu'),
      props: menuAddonPropsSchema,
    }),
  ]),
) as z.ZodType<WebsiteAddon>

function blockTreeStats(
  blocks: WebsiteBlock[],
  depth = 1,
): { maxDepth: number; total: number } {
  let maxDepth = depth
  let total = blocks.length
  for (const block of blocks) {
    const child = blockTreeStats(block.children ?? [], depth + 1)
    maxDepth = Math.max(maxDepth, child.maxDepth)
    total += child.total
  }
  return { maxDepth, total }
}

/** Remove retired imageSlider addons before validation so legacy docs still load. */
function stripLegacyImageSliders(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const doc = value as { blocks?: unknown[] }
  if (!Array.isArray(doc.blocks)) return value

  function stripBlock(block: unknown): unknown {
    if (!block || typeof block !== 'object') return block
    const node = block as {
      addons?: unknown[]
      children?: unknown[]
    }
    const addons = Array.isArray(node.addons)
      ? node.addons
          .filter((addon) => !(addon && typeof addon === 'object' && (addon as { type?: string }).type === 'imageSlider'))
          .map((addon) => {
            if (!addon || typeof addon !== 'object') return addon
            const typed = addon as { type?: string; props?: { slideTemplate?: unknown } }
            if (typed.type !== 'slider' || !typed.props?.slideTemplate) return addon
            return {
              ...typed,
              props: {
                ...typed.props,
                slideTemplate: stripBlock(typed.props.slideTemplate),
              },
            }
          })
      : node.addons
    const children = Array.isArray(node.children) ? node.children.map(stripBlock) : node.children
    return { ...node, addons, children }
  }

  return { ...doc, blocks: doc.blocks.map(stripBlock) }
}

export const websiteDocumentSchema = z.preprocess(
  stripLegacyImageSliders,
  z
    .object({
      version: z.literal(1),
      container: z.object({
        height: z.number().min(64).max(20000).default(640),
        backgroundColor: z.string().max(32).optional(),
      }),
      blocks: z.array(websiteBlockSchema).max(MAX_ROOT_BLOCKS).default([]),
    })
    .superRefine((document, ctx) => {
      const stats = blockTreeStats(document.blocks)
      if (stats.maxDepth > MAX_BLOCK_TREE_DEPTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Content element nesting exceeds max depth of ${MAX_BLOCK_TREE_DEPTH}`,
          path: ['blocks'],
        })
      }
      if (stats.total > MAX_TOTAL_BLOCKS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Document exceeds max of ${MAX_TOTAL_BLOCKS} content elements`,
          path: ['blocks'],
        })
      }
    }),
)

export type LayoutRect = z.infer<typeof layoutRectSchema>
export type LayoutByBreakpoint = z.infer<typeof layoutByBreakpointSchema>
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
