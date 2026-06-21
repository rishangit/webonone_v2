import { z } from 'zod'

export const SCOPE_REGEX = /^[a-z0-9-]+:[a-z0-9-]+:[A-Za-z0-9_-]+(\/[A-Za-z0-9_/-]*)?$/

export const scopeSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(SCOPE_REGEX, 'Invalid scope format')

export const folderPathSchema = z
  .string()
  .regex(/^(\/[A-Za-z0-9_/-]*)?$/, 'Invalid folder path')
  .default('/')

export const listMediaQuerySchema = z.object({
  scope: scopeSchema,
  folderPath: folderPathSchema.optional().default('/'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(24),
  mimeType: z.string().optional(),
})

export const listFoldersQuerySchema = z.object({
  scope: scopeSchema,
  parentPath: folderPathSchema.optional().default('/'),
})

export const createFolderBodySchema = z.object({
  scope: scopeSchema,
  path: z.string().regex(/^\/[A-Za-z0-9_/-]+$/, 'Invalid folder path'),
  name: z.string().min(1).max(255),
})

export const renameFolderBodySchema = z.object({
  name: z.string().min(1).max(255),
})

export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>
export type ListFoldersQuery = z.infer<typeof listFoldersQuerySchema>
export type CreateFolderBody = z.infer<typeof createFolderBodySchema>

export interface MediaItemDto {
  id: string
  scope: string
  folderPath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  url: string
  createdAt: string
}

export interface MediaFolderDto {
  id: string
  scope: string
  path: string
  name: string
  createdAt: string
}
