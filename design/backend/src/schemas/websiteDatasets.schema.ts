import { z } from 'zod'
import {
  DATASET_SOURCE_TYPES,
  assertFiltersMatchSource,
  datasetConfigSchema,
  datasetFiltersSchema,
} from './websiteDatasetFilters.schema.js'

export const createWebsiteDatasetSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    sourceType: z.enum(DATASET_SOURCE_TYPES),
    filters: datasetFiltersSchema.optional().default({ match: 'all', rules: [] }),
    config: datasetConfigSchema.optional().default({}),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  })
  .superRefine((body, ctx) => {
    try {
      assertFiltersMatchSource(body.sourceType, body.filters, body.config)
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : 'Invalid filters',
        path: ['filters'],
      })
    }
  })

export const updateWebsiteDatasetSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    sourceType: z.enum(DATASET_SOURCE_TYPES).optional(),
    filters: datasetFiltersSchema.optional(),
    config: datasetConfigSchema.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export const datasetPreviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export type CreateWebsiteDatasetBody = z.infer<typeof createWebsiteDatasetSchema>
export type UpdateWebsiteDatasetBody = z.infer<typeof updateWebsiteDatasetSchema>
