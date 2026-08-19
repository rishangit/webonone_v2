import { AI_CAPABILITY_VERSION, type ToolDefinition } from './capabilityTypes.js'

const stringId = { type: 'string', minLength: 8, maxLength: 32 }

const listQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    q: { type: 'string', description: 'Optional name or description search' },
    names: {
      type: 'string',
      description: 'Comma-separated exact names (case-insensitive). Use to check which names already exist.',
    },
    status: { type: 'string', enum: ['verified', 'pending'] },
    page: { type: 'integer', minimum: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100 },
  },
}

const idOnlySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: { id: stringId },
}

function uniqueNameArgCompletion(
  resource: string,
  extra?: ToolDefinition['argCompletion'],
): ToolDefinition['argCompletion'] {
  return {
    ...extra,
    uniqueBy: 'name',
    uniqueLookup: { method: 'GET', path: `/api/v1/${resource}`, queryParam: 'names' },
  }
}

function dataTool(def: Omit<ToolDefinition, 'service' | 'capabilityVersion'>): ToolDefinition {
  return {
    ...def,
    service: 'data',
    capabilityVersion: AI_CAPABILITY_VERSION,
  }
}

const libraryReadRoles: ToolDefinition['requiredRoles'] = ['member', 'company_admin', 'super_admin']
const libraryCreateRoles: ToolDefinition['requiredRoles'] = ['company_admin', 'super_admin']
const libraryAdminRoles: ToolDefinition['requiredRoles'] = ['super_admin']
const catalogWriteRoles: ToolDefinition['requiredRoles'] = ['company_admin', 'super_admin']

function libraryCrud(options: {
  resource: 'tags' | 'units' | 'attributes'
  singular: string
  listDescription: string
  createDescription: string
  createRequired: string[]
  createProperties: Record<string, unknown>
  updateProperties: Record<string, unknown>
  createArgCompletion?: ToolDefinition['argCompletion']
  relatedArgs?: ToolDefinition['relatedArgs']
  viewPath?: string
}): ToolDefinition[] {
  const { resource, singular } = options
  const viewPath = options.viewPath
  return [
    dataTool({
      name: `list_data_${resource}`,
      description: options.listDescription,
      jsonSchema: listQuerySchema,
      riskLevel: 'read',
      requiredRoles: libraryReadRoles,
      requiredPermissions: ['ai:data_library:read'],
      auth: 'user_jwt',
      invoke: { method: 'GET', path: `/api/v1/${resource}` },
      ...(viewPath ? { viewPath } : {}),
    }),
    dataTool({
      name: `get_data_${singular}`,
      description: `Get one Data library ${singular} by id.`,
      jsonSchema: idOnlySchema,
      riskLevel: 'read',
      requiredRoles: libraryReadRoles,
      requiredPermissions: ['ai:data_library:read'],
      auth: 'user_jwt',
      invoke: { method: 'GET', path: `/api/v1/${resource}/:id` },
      ...(viewPath ? { viewPath } : {}),
    }),
    dataTool({
      name: `create_data_${singular}`,
      description: options.createDescription,
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        required: options.createRequired,
        properties: options.createProperties,
      },
      riskLevel: 'write',
      requiredRoles: libraryCreateRoles,
      requiredPermissions: ['ai:data_library:write'],
      auth: 'user_jwt',
      invoke: { method: 'POST', path: `/api/v1/${resource}` },
      argCompletion: uniqueNameArgCompletion(resource, options.createArgCompletion),
      ...(options.relatedArgs ? { relatedArgs: options.relatedArgs } : {}),
      ...(viewPath ? { viewPath } : {}),
    }),
    dataTool({
      name: `update_data_${singular}`,
      description: `Update a Data library ${singular}. Super-admin only.`,
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: stringId, ...options.updateProperties },
      },
      riskLevel: 'write',
      requiredRoles: libraryAdminRoles,
      requiredPermissions: ['ai:data_library:admin'],
      auth: 'user_jwt',
      invoke: { method: 'PATCH', path: `/api/v1/${resource}/:id` },
      ...(viewPath ? { viewPath } : {}),
    }),
    dataTool({
      name: `delete_data_${singular}`,
      description: `Delete a Data library ${singular}. Super-admin only. Destructive; requires user confirmation.`,
      jsonSchema: idOnlySchema,
      riskLevel: 'destructive',
      requiredRoles: libraryAdminRoles,
      requiredPermissions: ['ai:data_library:admin'],
      auth: 'user_jwt',
      invoke: { method: 'DELETE', path: `/api/v1/${resource}/:id` },
    }),
  ]
}

const catalogCreateProperties: Record<string, unknown> = {
  name: { type: 'string', description: 'Display name of the catalog item.' },
  description: {
    type: 'string',
    description:
      'Required 1–3 sentence explanation of what this item is, who it is for, and when to use it. Suggest a complete value even if the user only gave a name.',
  },
  status: { type: 'string', enum: ['verified', 'pending'], description: 'Do not set unless the user asked. Company-admin creates stay pending.' },
  tags: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        color: { type: 'string' },
        status: { type: 'string' },
      },
    },
    description:
      'Relevant library tags for this item by name (and full tag fields if the tag is new). List tags first. Do not invent opaque ids. Do not dump the entire tag library.',
  },
  tag_ids: {
    type: 'array',
    items: stringId,
    description: 'Do not invent or display these ids. Use tags names instead.',
  },
  attributes: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value_type: { type: 'string', enum: ['number', 'text'] },
        description: { type: 'string' },
        unit: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            symbol: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
    description:
      'Relevant library attributes for this item by name. Number attributes must include a related unit name and symbol. List attributes and units first. Do not invent opaque ids.',
  },
}

const catalogRelatedArgs: ToolDefinition['relatedArgs'] = [
  {
    argKey: 'tag_ids',
    displayKey: 'tags',
    cardinality: 'many',
    getPath: '/api/v1/tags/:id',
    listPath: '/api/v1/tags',
    createTool: 'create_data_tag',
  },
  {
    argKey: 'attributes',
    displayKey: 'attributes',
    cardinality: 'many',
    itemIdKey: 'attribute_id',
    getPath: '/api/v1/attributes/:id',
    listPath: '/api/v1/attributes',
    createTool: 'create_data_attribute',
  },
]

function catalogCrud(options: {
  resource: 'products' | 'services' | 'spaces'
  singular: string
  extraCreate?: Record<string, unknown>
  extraRequired?: string[]
}): ToolDefinition[] {
  const { resource, singular } = options
  const createProperties = { ...catalogCreateProperties, ...options.extraCreate }
  const viewPath = `/${resource}/{id}`
  return [
    dataTool({
      name: `list_data_${resource}`,
      description: `List Data library ${resource}. Use this for the shared platform catalog, not the public marketplace.`,
      jsonSchema: listQuerySchema,
      riskLevel: 'read',
      requiredRoles: libraryReadRoles,
      requiredPermissions: ['ai:data_library:read'],
      auth: 'user_jwt',
      invoke: { method: 'GET', path: `/api/v1/${resource}` },
      viewPath,
    }),
    dataTool({
      name: `get_data_${singular}`,
      description: `Get one Data library ${singular} by id.`,
      jsonSchema: idOnlySchema,
      riskLevel: 'read',
      requiredRoles: libraryReadRoles,
      requiredPermissions: ['ai:data_library:read'],
      auth: 'user_jwt',
      invoke: { method: 'GET', path: `/api/v1/${resource}/:id` },
      viewPath,
    }),
    dataTool({
      name: `create_data_${singular}`,
      description: `Create a Data library ${singular} (a catalog ${singular}, not a tag). Fill every schema field before confirm: name, description, relevant tags, relevant attributes (each number attribute with a unit name and symbol), and status. List related tags, attributes, and units first. Use names, never opaque ids. Suggest only related records that fit this item — do not dump the whole library. New related tags, attributes, and units nest under the confirm row. Company-admin creates stay pending until a super admin verifies them.`,
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', ...(options.extraRequired ?? [])],
        properties: createProperties,
      },
      riskLevel: 'write',
      requiredRoles: catalogWriteRoles,
      requiredPermissions: ['ai:data_catalog:write'],
      auth: 'user_jwt',
      invoke: { method: 'POST', path: `/api/v1/${resource}` },
      argCompletion: uniqueNameArgCompletion(resource),
      relatedArgs: catalogRelatedArgs,
      viewPath,
    }),
    dataTool({
      name: `update_data_${singular}`,
      description: `Update a Data library ${singular}.`,
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: stringId, ...createProperties },
      },
      riskLevel: 'write',
      requiredRoles: catalogWriteRoles,
      requiredPermissions: ['ai:data_catalog:write'],
      auth: 'user_jwt',
      invoke: { method: 'PATCH', path: `/api/v1/${resource}/:id` },
      viewPath,
    }),
    dataTool({
      name: `delete_data_${singular}`,
      description: `Delete a Data library ${singular}. Super-admin only. Destructive; requires user confirmation.`,
      jsonSchema: idOnlySchema,
      riskLevel: 'destructive',
      requiredRoles: libraryAdminRoles,
      requiredPermissions: ['ai:data_library:admin'],
      auth: 'user_jwt',
      invoke: { method: 'DELETE', path: `/api/v1/${resource}/:id` },
    }),
  ]
}

const unitProperties = {
  name: { type: 'string', description: 'Unit display name, for example Metre or Kilogram.' },
  description: {
    type: 'string',
    description:
      'Required 1–3 sentence explanation of what this unit measures and when to use it. Suggest a complete value even if the user only gave a name.',
  },
  symbol: { type: 'string', description: 'Short symbol such as m, kg, or L.' },
  is_base: {
    type: 'boolean',
    description:
      'Suggest true for a base unit (Gram, Liter) and false for a derived unit (Milligram). Include this field on every create suggestion.',
  },
  base_unit_id: {
    ...stringId,
    description:
      'Do not invent or display this id. For derived units, name the existing base unit (from list_data_units). Leave empty when is_base is true.',
  },
  status: {
    type: 'string',
    enum: ['verified', 'pending'],
    description: 'pending (Unverified) or verified only. Never send active, enabled, or draft.',
  },
}

const TAG_COLOR_PALETTE = [
  '#3366FF',
  '#16A34A',
  '#DC2626',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#CA8A04',
  '#4F46E5',
  '#059669',
  '#EA580C',
  '#9333EA',
  '#0284C7',
  '#BE123C',
  '#0D9488',
  '#C026D3',
] as const

const tagProperties = {
  name: { type: 'string', description: 'Tag display name (form field Name). PascalCase with no spaces; first letter capital (PharmacyInventory, not pharmacyInventory).' },
  description: {
    type: 'string',
    description:
      'Required format: {Spaced Name} - {1-3 descriptive sentences about the topic}. Always put the tag name in front, split at every camelCase or PascalCase boundary so search can match each word (HealthServices becomes Health Services, GeneralConsultation becomes General Consultation). Never start with a concatenated word such as Healthcare; write Health care as two words in the sentences after the hyphen. Do not mention tags, labels, or catalog items. Do not start with Tags for or Tags related to. Good: name HealthServices → Health Services - Health care services and providers that deliver medical advice, treatment, and related support. Good: Hearing Care - Services that help maintain healthy hearing and address hearing-related concerns. Avoid: Healthcare services and providers (no spaced prefix, Healthcare is one word). Avoid: Tags related to health and wellness practices.',
  },
  color: {
    type: 'string',
    enum: TAG_COLOR_PALETTE,
    description:
      'Optional hex color #RRGGBB from the tag palette. Omit unless the user asked for a specific color; a random palette color is applied the same way as the create-tag form.',
  },
  status: {
    type: 'string',
    enum: ['verified', 'pending'],
    description:
      'Form field Status: pending is Unverified, verified is Verified. Always send pending unless the user is super-admin and asked for Verified.',
  },
}

const attributeProperties = {
  name: { type: 'string', description: 'Attribute display name, for example Width or Material.' },
  description: {
    type: 'string',
    description:
      'Required 1–3 sentence explanation of what this attribute records and how it is used. Suggest a complete value even if the user only gave a name.',
  },
  value_type: { type: 'string', enum: ['number', 'text'], description: 'number for measurable values, text otherwise.' },
  unit_id: {
    ...stringId,
    description:
      'Do not invent or display this id. For number attributes, name the related unit (for example Milligram / mg) from list_data_units. Leave empty for text attributes.',
  },
  status: {
    type: 'string',
    enum: ['verified', 'pending'],
    description: 'pending (Unverified) or verified only. Never send active, enabled, or draft.',
  },
}

export const dataAiCapabilities: ToolDefinition[] = [
  ...libraryCrud({
    resource: 'units',
    singular: 'unit',
    listDescription:
      'List Data library units of measure. Units have a name and symbol (for example Metre / m). There is no length or weight category. Call this before create_data_unit so derived units can copy a real base_unit_id and so existing related units are not duplicated. Use this instead of search_public_catalog when the user asks to add or find units.',
    createDescription:
      'Create a Data library unit of measure. Suggest every schema field before confirm: name, symbol, description, is_base, base unit (by name, not id), and status. List related units first (list_data_units). Set is_base true for a base unit; for derived units set is_base false and name the base unit. There is no length category field. Company-admin creates stay pending until a super admin verifies them.',
    createRequired: ['name', 'symbol', 'description'],
    createProperties: unitProperties,
    updateProperties: unitProperties,
    viewPath: '/units/{id}',
    relatedArgs: [
      {
        argKey: 'base_unit_id',
        displayKey: 'base_unit',
        cardinality: 'one',
        getPath: '/api/v1/units/:id',
        listPath: '/api/v1/units',
        createTool: 'create_data_unit',
      },
    ],
    createArgCompletion: {
      defaults: { status: 'pending' },
      forceByRole: { company_admin: { status: 'pending' } },
    },
  }),
  ...libraryCrud({
    resource: 'tags',
    singular: 'tag',
    listDescription: 'List Data library tags. Use this for the shared platform tag library, not the public marketplace.',
    createDescription:
      'Create a new Data library tag only (the shared tag library). Do not use this to create a product, service, or space, and do not use it to attach a tag to an existing item. Suggest every schema field before confirm: name, description, color, and status (pending = Unverified; verified only if super-admin asked). List related tags first (list_data_tags) so names are not duplicated. Keep name PascalCase with no spaces and a capital first letter (PharmacyInventory, not pharmacyInventory; HealthServices). Description is tags-only: Spaced Name - 1-3 descriptive sentences (HealthServices → Health Services - Health care services and providers that deliver medical advice, treatment, and related support). Split the name into separate words in front of the description so search can match Health and Services; do not write Healthcare as one word. Write about the topic, not about tags or labels. Omit color only if a palette default will be applied like the create-tag form. Company-admin creates stay Unverified until a super admin verifies them.',
    createRequired: ['name', 'description', 'status'],
    createProperties: tagProperties,
    updateProperties: tagProperties,
    viewPath: '/tags/{id}',
    createArgCompletion: {
      allowedKeys: ['name', 'description', 'color', 'status'],
      defaults: { status: 'pending' },
      forceByRole: { company_admin: { status: 'pending' } },
      pascalCaseKeys: ['name'],
    },
  }),
  ...libraryCrud({
    resource: 'attributes',
    singular: 'attribute',
    listDescription:
      'List Data library attributes (name, value_type, optional unit). Call this before create_data_attribute, and list_data_units when suggesting a related unit for number attributes.',
    createDescription:
      'Create a Data library attribute. Suggest every schema field before confirm: name, value_type (number or text), description, related unit (by name and symbol, never an opaque unit id), and status. For number attributes, list_data_units first and attach the matching unit by name. If the unit is not in the library yet, also create that unit. Company-admin creates stay pending until a super admin verifies them.',
    createRequired: ['name', 'value_type', 'description'],
    createProperties: attributeProperties,
    updateProperties: attributeProperties,
    viewPath: '/attributes/{id}',
    relatedArgs: [
      {
        argKey: 'unit_id',
        displayKey: 'unit',
        cardinality: 'one',
        getPath: '/api/v1/units/:id',
        listPath: '/api/v1/units',
        createTool: 'create_data_unit',
      },
    ],
    createArgCompletion: {
      defaults: { status: 'pending' },
      forceByRole: { company_admin: { status: 'pending' } },
    },
  }),
  ...catalogCrud({ resource: 'products', singular: 'product' }),
  ...catalogCrud({
    resource: 'services',
    singular: 'service',
    extraRequired: ['time_mode'],
    extraCreate: {
      time_mode: {
        type: 'string',
        enum: ['duration', 'window'],
        description: 'duration for a fixed length; window for a start and end time. Suggest duration unless the user specified a window.',
      },
      duration_minutes: {
        type: 'integer',
        minimum: 1,
        description: 'Required when time_mode is duration. Suggest a typical length if the user did not specify.',
      },
      start_time: { type: 'string', description: 'HH:mm. Use only when time_mode is window. Do not invent a window if duration applies.' },
      end_time: { type: 'string', description: 'HH:mm. Use only when time_mode is window.' },
    },
  }),
  ...catalogCrud({ resource: 'spaces', singular: 'space' }),
]
