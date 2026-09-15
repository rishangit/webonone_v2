import { AI_CAPABILITY_VERSION, type ToolDefinition } from './capabilityTypes.js'

const stringId = { type: 'string', minLength: 8, maxLength: 32 }

function smsTool(def: Omit<ToolDefinition, 'service' | 'capabilityVersion'>): ToolDefinition {
  return {
    ...def,
    service: 'sms',
    capabilityVersion: AI_CAPABILITY_VERSION,
  }
}

export const smsAiCapabilities: ToolDefinition[] = [
  smsTool({
    name: 'list_sms_templates',
    description: 'List SMS message templates available to the signed-in user.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1, maximum: 100 },
        q: { type: 'string', description: 'Optional search by template name or slug.' },
      },
    },
    riskLevel: 'read',
    requiredRoles: ['company_admin', 'super_admin', 'member'],
    requiredPermissions: ['ai:sms:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/templates' },
    viewPath: '/templates',
  }),
  smsTool({
    name: 'get_sms_template',
    description: 'Get one SMS template by id.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Template id from list_sms_templates.' },
      },
    },
    riskLevel: 'read',
    requiredRoles: ['company_admin', 'super_admin', 'member'],
    requiredPermissions: ['ai:sms:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/templates/:id' },
    viewPath: '/templates/{id}',
  }),
]
