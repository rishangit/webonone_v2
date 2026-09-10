import { z } from 'zod'

export const DATASET_SOURCE_TYPES = [
  'products',
  'services',
  'spaces',
  'staff',
  'users',
  'analytics',
] as const

export type DatasetSourceType = (typeof DATASET_SOURCE_TYPES)[number]

export const DATASET_FILTER_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'contains',
  'in',
] as const

export type DatasetFilterOperator = (typeof DATASET_FILTER_OPERATORS)[number]

export const ANALYTICS_DIMENSIONS = [
  'kpis',
  'revenue_over_time',
  'top_products',
  'top_services',
  'top_spaces',
  'top_customers',
  'sales_by_staff',
  'event_run_status',
  'token_status',
] as const

export type AnalyticsDimension = (typeof ANALYTICS_DIMENSIONS)[number]

export type DatasetFieldValueType = 'string' | 'number' | 'enum'

export type DatasetFieldDef = {
  field: string
  label: string
  valueType: DatasetFieldValueType
  operators: DatasetFilterOperator[]
  enumValues?: string[]
}

const STRING_OPS: DatasetFilterOperator[] = ['eq', 'neq', 'contains', 'in']
const NUMBER_OPS: DatasetFilterOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between']
const ENUM_OPS: DatasetFilterOperator[] = ['eq', 'neq', 'in']

const CATALOG_BASE_FIELDS: DatasetFieldDef[] = [
  { field: 'id', label: 'ID', valueType: 'string', operators: STRING_OPS },
  { field: 'name', label: 'Name', valueType: 'string', operators: STRING_OPS },
  {
    field: 'status',
    label: 'Status',
    valueType: 'enum',
    operators: ENUM_OPS,
    enumValues: ['verified', 'pending'],
  },
  { field: 'listPrice', label: 'Price', valueType: 'number', operators: NUMBER_OPS },
  { field: 'description', label: 'Description', valueType: 'string', operators: STRING_OPS },
]

const SERVICE_FIELDS: DatasetFieldDef[] = [
  ...CATALOG_BASE_FIELDS,
  {
    field: 'timeMode',
    label: 'Time mode',
    valueType: 'enum',
    operators: ENUM_OPS,
    enumValues: ['duration', 'window'],
  },
  { field: 'durationMinutes', label: 'Duration (minutes)', valueType: 'number', operators: NUMBER_OPS },
]

const STAFF_FIELDS: DatasetFieldDef[] = [
  { field: 'id', label: 'ID', valueType: 'string', operators: STRING_OPS },
  { field: 'displayName', label: 'Display name', valueType: 'string', operators: STRING_OPS },
  { field: 'email', label: 'Email', valueType: 'string', operators: STRING_OPS },
]

const USER_FIELDS: DatasetFieldDef[] = [
  { field: 'id', label: 'ID', valueType: 'string', operators: STRING_OPS },
  { field: 'displayName', label: 'Display name', valueType: 'string', operators: STRING_OPS },
  { field: 'email', label: 'Email', valueType: 'string', operators: STRING_OPS },
  {
    field: 'role',
    label: 'Role',
    valueType: 'enum',
    operators: ENUM_OPS,
    enumValues: ['company_admin', 'member'],
  },
]

const KPI_FIELDS: DatasetFieldDef[] = [
  { field: 'saleCount', label: 'Sale count', valueType: 'number', operators: NUMBER_OPS },
  { field: 'revenueTotal', label: 'Revenue total', valueType: 'number', operators: NUMBER_OPS },
  { field: 'profitTotal', label: 'Profit total', valueType: 'number', operators: NUMBER_OPS },
  { field: 'uniqueCustomers', label: 'Unique customers', valueType: 'number', operators: NUMBER_OPS },
  { field: 'staffCount', label: 'Staff count', valueType: 'number', operators: NUMBER_OPS },
  { field: 'productCount', label: 'Product count', valueType: 'number', operators: NUMBER_OPS },
  { field: 'serviceCount', label: 'Service count', valueType: 'number', operators: NUMBER_OPS },
  { field: 'spaceCount', label: 'Space count', valueType: 'number', operators: NUMBER_OPS },
  { field: 'occurrenceCount', label: 'Occurrence count', valueType: 'number', operators: NUMBER_OPS },
  { field: 'checkInCount', label: 'Check-in count', valueType: 'number', operators: NUMBER_OPS },
]

const TIME_BUCKET_FIELDS: DatasetFieldDef[] = [
  { field: 'date', label: 'Date', valueType: 'string', operators: STRING_OPS },
  { field: 'amount', label: 'Amount', valueType: 'number', operators: NUMBER_OPS },
  { field: 'profit', label: 'Profit', valueType: 'number', operators: NUMBER_OPS },
]

const NAMED_AMOUNT_FIELDS: DatasetFieldDef[] = [
  { field: 'label', label: 'Label', valueType: 'string', operators: STRING_OPS },
  { field: 'amount', label: 'Amount', valueType: 'number', operators: NUMBER_OPS },
]

const NAMED_COUNT_FIELDS: DatasetFieldDef[] = [
  { field: 'label', label: 'Label', valueType: 'string', operators: STRING_OPS },
  { field: 'count', label: 'Count', valueType: 'number', operators: NUMBER_OPS },
]

export const DATASET_FIELD_CATALOG: Record<Exclude<DatasetSourceType, 'analytics'>, DatasetFieldDef[]> = {
  products: CATALOG_BASE_FIELDS,
  services: SERVICE_FIELDS,
  spaces: CATALOG_BASE_FIELDS,
  staff: STAFF_FIELDS,
  users: USER_FIELDS,
}

export const ANALYTICS_FIELD_CATALOG: Record<AnalyticsDimension, DatasetFieldDef[]> = {
  kpis: KPI_FIELDS,
  revenue_over_time: TIME_BUCKET_FIELDS,
  top_products: NAMED_AMOUNT_FIELDS,
  top_services: NAMED_AMOUNT_FIELDS,
  top_spaces: NAMED_AMOUNT_FIELDS,
  top_customers: NAMED_AMOUNT_FIELDS,
  sales_by_staff: NAMED_AMOUNT_FIELDS,
  event_run_status: NAMED_COUNT_FIELDS,
  token_status: NAMED_COUNT_FIELDS,
}

const filterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.tuple([z.number(), z.number()]),
  z.array(z.string()),
])

export const datasetFilterRuleSchema = z
  .object({
    field: z.string().trim().min(1, 'Field is required').max(64),
    operator: z.enum(DATASET_FILTER_OPERATORS, { required_error: 'Operator is required' }),
    value: filterValueSchema,
  })
  .superRefine((rule, ctx) => {
    if (rule.operator === 'between') {
      if (!Array.isArray(rule.value) || rule.value.length !== 2 || typeof rule.value[0] !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Between requires a min and max number',
          path: ['value'],
        })
      }
      return
    }
    if (rule.operator === 'in') {
      if (!Array.isArray(rule.value) || rule.value.some((v) => typeof v !== 'string')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'In requires one or more text values',
          path: ['value'],
        })
      }
      return
    }
    if (Array.isArray(rule.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'This operator does not accept multiple values',
        path: ['value'],
      })
    }
  })

export const datasetFiltersSchema = z.object({
  match: z.literal('all').default('all'),
  rules: z.array(datasetFilterRuleSchema).max(20).default([]),
})

export const datasetDateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
})

export const datasetConfigSchema = z
  .object({
    dimension: z.enum(ANALYTICS_DIMENSIONS).optional(),
    dateRange: datasetDateRangeSchema.optional(),
  })
  .default({})

export const createWebsiteDatasetSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255),
    sourceType: z.enum(DATASET_SOURCE_TYPES, { required_error: 'Source type is required' }),
    filters: datasetFiltersSchema.optional().default({ match: 'all', rules: [] }),
    config: datasetConfigSchema.optional().default({}),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  })
  .superRefine((body, ctx) => {
    if (body.sourceType === 'analytics' && !body.config?.dimension) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Analytics dimension is required',
        path: ['config', 'dimension'],
      })
    }
  })

export const updateWebsiteDatasetSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255).optional(),
    sourceType: z.enum(DATASET_SOURCE_TYPES).optional(),
    filters: datasetFiltersSchema.optional(),
    config: datasetConfigSchema.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type DatasetFilterRule = z.infer<typeof datasetFilterRuleSchema>
export type DatasetFilters = z.infer<typeof datasetFiltersSchema>
export type DatasetConfig = z.infer<typeof datasetConfigSchema>
export type CreateWebsiteDatasetValues = z.infer<typeof createWebsiteDatasetSchema>
export type UpdateWebsiteDatasetValues = z.infer<typeof updateWebsiteDatasetSchema>

export function fieldsForSource(
  sourceType: DatasetSourceType,
  config?: DatasetConfig | null,
): DatasetFieldDef[] {
  if (sourceType === 'analytics') {
    const dimension = config?.dimension ?? 'kpis'
    return ANALYTICS_FIELD_CATALOG[dimension] ?? KPI_FIELDS
  }
  return DATASET_FIELD_CATALOG[sourceType]
}

export function emptyFilterRule(field = 'name'): DatasetFilterRule {
  return { field, operator: 'eq', value: '' }
}
