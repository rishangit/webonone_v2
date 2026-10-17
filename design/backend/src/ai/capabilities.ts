import { AI_CAPABILITY_VERSION, type ToolDefinition } from './capabilityTypes.js'

const stringId = { type: 'string', minLength: 8, maxLength: 32 }

const fieldOptionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['label'],
  properties: {
    label: {
      type: 'string',
      title: 'Option',
      description: 'Option label shown to the person filling the form. Do not invent an id.',
    },
  },
}

const controlProperties = {
  type: {
    type: 'string',
    title: 'Control type',
    enum: ['text', 'textarea', 'checkbox', 'radio', 'select', 'media'],
    description:
      'text or textarea for short or long answers, checkbox, radio, select for a dropdown, or media for documents.',
  },
  label: {
    type: 'string',
    title: 'Label',
    description: 'Label shown on the form for this control.',
  },
  required: {
    type: 'boolean',
    title: 'Required',
    description: 'True when the person filling the form must answer this control.',
  },
  placeholder: {
    type: 'string',
    title: 'Placeholder',
    description: 'Hint inside a text, textarea, or select control. Omit for checkbox, radio, and media.',
  },
  allowMultiple: {
    type: 'boolean',
    title: 'Allow multiple',
    description: 'Media controls only. True when more than one file may be attached.',
  },
  options: {
    type: 'array',
    title: 'Options',
    description:
      'Required for radio and select. Each entry is an option label. Do not invent option ids.',
    items: fieldOptionSchema,
  },
}

const fieldsSchema = {
  type: 'array',
  title: 'Controls',
  description:
    'Every control the user asked for, with its settings. Include this on create. Do not invent field ids.',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'label'],
    properties: controlProperties,
  },
}

const readRoles: ToolDefinition['requiredRoles'] = ['member', 'company_admin', 'super_admin']
const writeRoles: ToolDefinition['requiredRoles'] = ['company_admin', 'super_admin']
const formViewPath = '/forms/{id}/edit'

function designTool(def: Omit<ToolDefinition, 'service' | 'capabilityVersion'>): ToolDefinition {
  return {
    ...def,
    service: 'design',
    capabilityVersion: AI_CAPABILITY_VERSION,
  }
}

export const designAiCapabilities: ToolDefinition[] = [
  designTool({
    name: 'list_design_forms',
    description:
      'List company forms for the signed-in company. Use this before creating a form so the slug does not clash, and before adding or updating a control so you can copy the form id.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1, maximum: 100 },
        q: { type: 'string', description: 'Optional search by form name or slug.' },
        status: { type: 'string', enum: ['draft', 'published'] },
      },
    },
    riskLevel: 'read',
    requiredRoles: readRoles,
    requiredPermissions: ['ai:design:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/forms' },
    viewPath: formViewPath,
  }),
  designTool({
    name: 'get_design_form',
    description:
      'Get one company form by id, including definition.fields. Copy each control id from definition.fields when updating that control. Never invent field ids.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Form id from list_design_forms.' },
      },
    },
    riskLevel: 'read',
    requiredRoles: readRoles,
    requiredPermissions: ['ai:design:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/forms/:id' },
    viewPath: formViewPath,
  }),
  designTool({
    name: 'create_design_form',
    description:
      'Create a company form in Design. Use this when the user asks to create a form. Fill name, a lowercase hyphenated slug derived from the name, status, and fields. Put every requested control and its settings in fields on this same call: type, label, required, placeholder for text, textarea, or select, allowMultiple for media only, and option labels for radio and select. Radio and select need at least one option. Do not invent field or option ids. Do not set status to published unless the user asked to publish. Do not call add_design_form_field in the same turn — the form id does not exist until the user confirms this create.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'slug'],
      properties: {
        name: { type: 'string', title: 'Name', description: 'Form name shown in Design → Forms.' },
        slug: {
          type: 'string',
          title: 'Slug',
          description:
            'Lowercase letters, numbers, and hyphens derived from the name, for example patient-intake.',
        },
        status: {
          type: 'string',
          title: 'Status',
          enum: ['draft', 'published'],
          description: 'Leave draft unless the user asked to publish the form.',
        },
        fields: fieldsSchema,
      },
    },
    riskLevel: 'write',
    requiredRoles: writeRoles,
    requiredPermissions: ['ai:design:write'],
    auth: 'user_jwt',
    invoke: { method: 'POST', path: '/api/v1/forms' },
    argCompletion: { defaults: { status: 'draft' } },
    viewPath: formViewPath,
  }),
  designTool({
    name: 'add_design_form_field',
    description:
      'Add one control to an existing company form. Call list_design_forms or get_design_form first and copy the form id. Send type, label, and the settings that apply: required, placeholder for text, textarea, or select, allowMultiple for media only, and option labels for radio and select. Radio and select need at least one option. Do not invent ids. Do not use this to create a new form — use create_design_form and include every control in fields.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'label'],
      properties: {
        id: { ...stringId, description: 'Form id from list_design_forms or get_design_form.' },
        ...controlProperties,
      },
    },
    riskLevel: 'write',
    requiredRoles: writeRoles,
    requiredPermissions: ['ai:design:write'],
    auth: 'user_jwt',
    invoke: { method: 'POST', path: '/api/v1/forms/:id/fields' },
    viewPath: formViewPath,
  }),
  designTool({
    name: 'update_design_form_field',
    description:
      'Update one control on an existing company form. Call get_design_form first. Copy the form id and the field id from definition.fields. Send only the settings to change: label, required, placeholder, allowMultiple for media, or options. When options is sent, it replaces that control’s options. Omitted settings stay as they are. Do not invent ids. Do not resend the other controls.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'fieldId'],
      properties: {
        id: { ...stringId, description: 'Form id from get_design_form.' },
        fieldId: {
          ...stringId,
          description: 'Control id copied from definition.fields on get_design_form. Never invent this id.',
        },
        label: controlProperties.label,
        required: controlProperties.required,
        placeholder: controlProperties.placeholder,
        allowMultiple: controlProperties.allowMultiple,
        options: controlProperties.options,
      },
    },
    riskLevel: 'write',
    requiredRoles: writeRoles,
    requiredPermissions: ['ai:design:write'],
    auth: 'user_jwt',
    invoke: { method: 'PATCH', path: '/api/v1/forms/:id/fields/:fieldId' },
    viewPath: formViewPath,
  }),
  designTool({
    name: 'update_design_form',
    description:
      'Update a company form name, slug, or status. Use add_design_form_field to add a control and update_design_form_field to change a control. Do not send the control list on this tool. Set status to published only when the user asked to publish.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Form id from list_design_forms or get_design_form.' },
        name: { type: 'string', title: 'Name', description: 'New form name.' },
        slug: {
          type: 'string',
          title: 'Slug',
          description: 'Lowercase letters, numbers, and hyphens.',
        },
        status: {
          type: 'string',
          title: 'Status',
          enum: ['draft', 'published'],
          description: 'draft or published. Publish only when the user asked.',
        },
      },
    },
    riskLevel: 'write',
    requiredRoles: writeRoles,
    requiredPermissions: ['ai:design:write'],
    auth: 'user_jwt',
    invoke: { method: 'PATCH', path: '/api/v1/forms/:id' },
    viewPath: formViewPath,
  }),
]
