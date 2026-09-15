import { AI_CAPABILITY_VERSION, type ToolDefinition } from './capabilityTypes.js'

const stringId = { type: 'string', minLength: 8, maxLength: 32 }

function paymentTool(def: Omit<ToolDefinition, 'service' | 'capabilityVersion'>): ToolDefinition {
  return {
    ...def,
    service: 'payment',
    capabilityVersion: AI_CAPABILITY_VERSION,
  }
}

export const paymentAiCapabilities: ToolDefinition[] = [
  paymentTool({
    name: 'list_payment_invoices',
    description:
      'List system subscription invoices for the signed-in company (or all companies for super_admin). Supports page, pageSize, status, q, from, and to filters.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1, maximum: 100 },
        status: {
          type: 'string',
          enum: ['pending', 'paid', 'overdue', 'void'],
          description: 'Optional invoice status filter.',
        },
        q: { type: 'string', description: 'Optional search text.' },
        from: { type: 'string', description: 'Optional from date (YYYY-MM-DD).' },
        to: { type: 'string', description: 'Optional to date (YYYY-MM-DD).' },
        companyId: {
          ...stringId,
          description: 'Super-admin only: filter by company id.',
        },
      },
    },
    riskLevel: 'read',
    requiredRoles: ['company_admin', 'super_admin'],
    requiredPermissions: ['ai:payment:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/invoices' },
    viewPath: '/invoices',
  }),
  paymentTool({
    name: 'get_payment_invoice',
    description: 'Get one payment invoice by id.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Invoice id from list_payment_invoices.' },
      },
    },
    riskLevel: 'read',
    requiredRoles: ['company_admin', 'super_admin'],
    requiredPermissions: ['ai:payment:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/invoices/:id' },
    viewPath: '/invoices/{id}',
  }),
]
