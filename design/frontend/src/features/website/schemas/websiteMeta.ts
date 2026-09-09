import { z } from 'zod'

export const pageMetaSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  path: z
    .string()
    .trim()
    .max(128)
    .regex(/^$|^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, 'Use lowercase letters, numbers, and slashes'),
  status: z.enum(['active', 'inactive']).default('active'),
  layoutId: z.string().trim().max(21).nullable().optional(),
})

export const chromeMetaSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  isDefault: z.boolean().optional().default(false),
})

export const layoutMetaSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  headerId: z.string().trim().max(21).nullable().optional(),
  footerId: z.string().trim().max(21).nullable().optional(),
  themeId: z.string().trim().max(21).nullable().optional(),
  isDefault: z.boolean().optional().default(false),
  pageIds: z.array(z.string().trim().min(1).max(21)).optional(),
})

export const themeMetaSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  pageBackground: z.string().max(32).optional(),
  bodyTextColor: z.string().max(32).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

export type PageMetaValues = z.infer<typeof pageMetaSchema>
export type ChromeMetaValues = z.infer<typeof chromeMetaSchema>
export type LayoutMetaValues = z.infer<typeof layoutMetaSchema>
export type ThemeMetaValues = z.infer<typeof themeMetaSchema>

export function slugifyPath(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 128)
}
