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

export const PUBLIC_FIELD_WHITELIST: Record<DatasetSourceType, readonly string[]> = {
  products: ['id', 'name', 'description', 'status', 'listPrice', 'galleryImages'],
  services: [
    'id',
    'name',
    'description',
    'status',
    'listPrice',
    'galleryImages',
    'timeMode',
    'durationMinutes',
    'startTime',
    'endTime',
  ],
  spaces: ['id', 'name', 'description', 'status', 'listPrice', 'galleryImages'],
  staff: ['id', 'displayName', 'avatarUrl', 'schedule'],
  users: ['id', 'displayName', 'avatarUrl', 'role'],
  analytics: ['*'],
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
    field: z.string().trim().min(1).max(64),
    operator: z.enum(DATASET_FILTER_OPERATORS),
    value: filterValueSchema,
  })
  .superRefine((rule, ctx) => {
    if (rule.operator === 'between') {
      if (!Array.isArray(rule.value) || rule.value.length !== 2 || typeof rule.value[0] !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'between requires a numeric [min, max] value',
          path: ['value'],
        })
      }
      return
    }
    if (rule.operator === 'in') {
      if (!Array.isArray(rule.value) || rule.value.some((v) => typeof v !== 'string')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'in requires a string array value',
          path: ['value'],
        })
      }
      return
    }
    if (Array.isArray(rule.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${rule.operator} does not accept an array value`,
        path: ['value'],
      })
    }
  })

export const datasetFiltersSchema = z.object({
  match: z.literal('all').default('all'),
  rules: z.array(datasetFilterRuleSchema).max(20).default([]),
})

export const datasetDateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const datasetConfigSchema = z
  .object({
    dimension: z.enum(ANALYTICS_DIMENSIONS).optional(),
    dateRange: datasetDateRangeSchema.optional(),
  })
  .default({})

export type DatasetFilterRule = z.infer<typeof datasetFilterRuleSchema>
export type DatasetFilters = z.infer<typeof datasetFiltersSchema>
export type DatasetConfig = z.infer<typeof datasetConfigSchema>

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

export function assertFiltersMatchSource(
  sourceType: DatasetSourceType,
  filters: DatasetFilters,
  config?: DatasetConfig | null,
): void {
  const allowed = new Map(fieldsForSource(sourceType, config).map((f) => [f.field, f]))
  for (const rule of filters.rules) {
    const field = allowed.get(rule.field)
    if (!field) {
      throw new Error(`Field "${rule.field}" is not allowed for source type "${sourceType}"`)
    }
    if (!field.operators.includes(rule.operator)) {
      throw new Error(`Operator "${rule.operator}" is not allowed for field "${rule.field}"`)
    }
  }
  if (sourceType === 'analytics' && !config?.dimension) {
    throw new Error('Analytics datasets require config.dimension')
  }
}

export function getDatasetFieldCatalogPayload() {
  return {
    sourceTypes: DATASET_SOURCE_TYPES,
    operators: DATASET_FILTER_OPERATORS,
    fieldsBySource: DATASET_FIELD_CATALOG,
    analyticsDimensions: ANALYTICS_DIMENSIONS,
    fieldsByAnalyticsDimension: ANALYTICS_FIELD_CATALOG,
  }
}

export function pickPublicFields(
  sourceType: DatasetSourceType,
  item: Record<string, unknown>,
): Record<string, unknown> {
  const whitelist = PUBLIC_FIELD_WHITELIST[sourceType]
  if (whitelist.includes('*')) return item
  const out: Record<string, unknown> = {}
  for (const key of whitelist) {
    if (key in item) out[key] = item[key]
  }
  return out
}
