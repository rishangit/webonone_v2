import { AI_CAPABILITY_VERSION, type ArgCompletion, type ToolDefinition } from './capabilityTypes.js'

const companyReadRoles: ToolDefinition['requiredRoles'] = ['member', 'company_admin']
const companyWriteRoles: ToolDefinition['requiredRoles'] = ['company_admin']
const platformReadRoles: ToolDefinition['requiredRoles'] = ['member', 'company_admin', 'super_admin']
const libraryReadRoles: ToolDefinition['requiredRoles'] = ['company_admin', 'super_admin']
const platformWriteRoles: ToolDefinition['requiredRoles'] = ['super_admin']

const listQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    q: { type: 'string', description: 'Optional name search.' },
    names: {
      type: 'string',
      description: 'Comma-separated exact names (case-insensitive). Use to check which names already exist.',
    },
    page: { type: 'integer', minimum: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100 },
  },
}

const nameProperty = {
  type: 'string',
  title: 'Name',
  description: 'Display name. Suggest a clear name even when the user only described the item.',
}

const blankDocumentNote =
  'Do not send a document. The designer starts blank and the user lays it out after confirm.'

const suggestNote =
  'When the user asks to add or suggest items without naming each one, suggest several that fit and are not already in the list. Call the matching list tool first. One create call per item. Fill every published property. Do not invent ids. Existing names are skipped.'

const stringId = { type: 'string', minLength: 8, maxLength: 32 }

const elementDesignNote =
  'Change only basic settings plus html, styles, and scripts. Omitted fields stay as they are. Keep {{label}} on buttons and {{content}} on text. For buttons the root tag MUST be <button type="button"> — never wrap it in a div. Put website-element-root, website-el-{id}, data-website-element="button", Tailwind utilities, and basic-setting CSS variables (--el-bg, --el-color, --el-border, --el-radius, --el-font-family, --el-font-size, --el-line-height) on that button. Styles MUST include a .website-el-{id} { } rule using the attached id. Do not invent a new id. Do not send page, theme, layout, or document fields.'

const htmlProperty = {
  type: 'string',
  title: 'HTML',
  description:
    'Markup for this library item. Keep the {{label}} or {{content}} placeholder. For buttons the root element is the <button> itself with class website-element-root and website-el-{id} — do not wrap the button in a div.',
}

const stylesProperty = {
  type: 'string',
  title: 'Styles',
  description:
    'CSS for this item only. Always include a .website-el-{id} { } root rule. Do not write page-wide rules.',
}

const scriptsProperty = {
  type: 'string',
  title: 'Script',
  description:
    'JavaScript that runs in the preview for this item. Keep it short and scoped to the root element. Empty string clears it.',
}

function designTool(def: Omit<ToolDefinition, 'service' | 'capabilityVersion'>): ToolDefinition {
  return { ...def, service: 'design', capabilityVersion: AI_CAPABILITY_VERSION }
}

function uniqueName(path: string, defaults?: Record<string, unknown>): ArgCompletion {
  return {
    uniqueBy: 'name',
    uniqueLookup: { method: 'GET', path, queryParam: 'names' },
    ...(defaults ? { defaults } : {}),
  }
}

function listAndCreate(options: {
  listName: string
  createName: string
  listDescription: string
  createDescription: string
  path: string
  viewPath?: string
  readRoles: ToolDefinition['requiredRoles']
  writeRoles: ToolDefinition['requiredRoles']
  readPermission: string
  writePermission: string
  createRequired: string[]
  createProperties: Record<string, unknown>
  defaults?: Record<string, unknown>
}): ToolDefinition[] {
  return [
    designTool({
      name: options.listName,
      description: options.listDescription,
      jsonSchema: listQuerySchema,
      riskLevel: 'read',
      requiredRoles: options.readRoles,
      requiredPermissions: [options.readPermission],
      auth: 'user_jwt',
      invoke: { method: 'GET', path: options.path },
      ...(options.viewPath ? { viewPath: options.viewPath } : {}),
    }),
    designTool({
      name: options.createName,
      description: options.createDescription,
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        required: options.createRequired,
        properties: options.createProperties,
      },
      riskLevel: 'write',
      requiredRoles: options.writeRoles,
      requiredPermissions: [options.writePermission],
      auth: 'user_jwt',
      invoke: { method: 'POST', path: options.path },
      argCompletion: uniqueName(options.path, options.defaults),
      ...(options.viewPath ? { viewPath: options.viewPath } : {}),
    }),
  ]
}

const pageProperties = {
  name: nameProperty,
  path: {
    type: 'string',
    title: 'Path',
    description:
      'Public path. Use an empty string for Home. Otherwise lowercase letters, numbers, and hyphens, for example about or contact-us. Copy an unused path; do not reuse a path from the list.',
  },
  status: {
    type: 'string',
    title: 'Status',
    enum: ['active', 'inactive'],
    description: 'Leave active unless the user asked to hide the page.',
  },
}

const themeProperties = {
  name: nameProperty,
  pageBackground: {
    type: 'string',
    title: 'Page background',
    description: 'Page background as #RRGGBB. Suggest a color that fits the theme name.',
  },
  bodyTextColor: {
    type: 'string',
    title: 'Body text color',
    description: 'Body text color as #RRGGBB. Keep it readable on the page background.',
  },
  isActive: {
    type: 'boolean',
    title: 'Active',
    description: 'True unless the user asked to keep the theme inactive.',
  },
  isDefault: {
    type: 'boolean',
    title: 'Default',
    description: 'False unless the user asked to make this the default theme.',
  },
}

const chromeProperties = {
  name: nameProperty,
  isDefault: {
    type: 'boolean',
    title: 'Default',
    description: 'False unless the user asked to make this the default.',
  },
}

const presetProperties = { name: nameProperty }

const layoutProperties = {
  name: nameProperty,
  isDefault: chromeProperties.isDefault,
}

const fontProperties = {
  name: {
    type: 'string',
    title: 'Name',
    description: 'Font name, for example Open Sans or Playfair Display.',
  },
  family: {
    type: 'string',
    title: 'Family',
    description: 'Same font family name as Name, with spaces, for example Open Sans.',
  },
  googleFontUrl: {
    type: 'string',
    title: 'Google Font URL',
    description:
      'Google Fonts CSS2 stylesheet. Spaces in the family become +. Example: https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap',
  },
}

const datasetProperties = {
  name: nameProperty,
  sourceType: {
    type: 'string',
    title: 'Source',
    enum: ['products', 'services', 'spaces', 'staff', 'users', 'analytics'],
    description: 'Which company records this data set reads.',
  },
  selectedFields: {
    type: 'array',
    title: 'Fields',
    items: { type: 'string' },
    description:
      'Property paths to show. products and spaces: name, description, listPrice, galleryImages. services: those plus timeMode, durationMinutes, startTime, endTime. staff: displayName, avatarUrl, schedule. users: displayName, avatarUrl, role. analytics: label and amount, or label and count, matching the dimension. Suggest the fields a website block would show. Do not invent ids.',
  },
  status: {
    type: 'string',
    title: 'Status',
    enum: ['active', 'inactive'],
    description: 'Leave active unless the user asked to hide the data set.',
  },
  config: {
    type: 'object',
    title: 'Config',
    additionalProperties: false,
    properties: {
      dimension: {
        type: 'string',
        title: 'Dimension',
        enum: [
          'kpis',
          'revenue_over_time',
          'top_products',
          'top_services',
          'top_spaces',
          'top_customers',
          'sales_by_staff',
          'event_run_status',
          'token_status',
        ],
        description: 'Required when source is analytics. Omit for other sources.',
      },
    },
  },
}

export const websiteAiCapabilities: ToolDefinition[] = [
  ...listAndCreate({
    listName: 'list_design_fonts',
    createName: 'create_design_font',
    path: '/api/v1/website/font-library',
    viewPath: '/website/fonts',
    readRoles: platformReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    listDescription:
      'List fonts in the platform Font library. Use this before suggesting fonts so existing names are not added again. Super admin can add fonts; company users can only read this list.',
    createDescription: `Add one Google font to the platform Font library. Super-admin only. Use this when the user asks to add or suggest fonts. Suggest real Google Fonts. If they do not name fonts, suggest several distinct families (one create call each) such as a text face and a heading face that are not already listed. Fill name, family, and googleFontUrl. ${suggestNote}`,
    createRequired: ['name', 'family', 'googleFontUrl'],
    createProperties: fontProperties,
  }),
  ...listAndCreate({
    listName: 'list_design_website_pages',
    createName: 'create_design_website_page',
    path: '/api/v1/website/pages',
    viewPath: '/website/pages/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    listDescription:
      'List pages on the signed-in company website. Company admin and member. Not the platform library.',
    createDescription: `Create one page on the signed-in company website. Company admin only. ${blankDocumentNote} ${suggestNote} A typical site includes Home (empty path), About, and Contact when those names are missing.`,
    createRequired: ['name', 'path'],
    createProperties: pageProperties,
    defaults: { status: 'active' },
  }),
  ...listAndCreate({
    listName: 'list_design_library_pages',
    createName: 'create_design_library_page',
    path: '/api/v1/website/library/pages',
    viewPath: '/website/pages/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    listDescription:
      'List pages in the platform website library. Super admin adds these so companies can copy them. Not a company website.',
    createDescription: `Create one page in the platform website library. Super-admin only. ${blankDocumentNote} ${suggestNote}`,
    createRequired: ['name', 'path'],
    createProperties: pageProperties,
    defaults: { status: 'active' },
  }),
  ...listAndCreate({
    listName: 'list_design_website_presets',
    createName: 'create_design_website_preset',
    path: '/api/v1/website/presets',
    viewPath: '/website/presets/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    listDescription: 'List presets on the signed-in company website.',
    createDescription: `Create one preset on the signed-in company website. Company admin only. ${blankDocumentNote} ${suggestNote} Suggest reusable sections such as Hero, Pricing, or Contact when those names are missing.`,
    createRequired: ['name'],
    createProperties: presetProperties,
  }),
  ...listAndCreate({
    listName: 'list_design_library_presets',
    createName: 'create_design_library_preset',
    path: '/api/v1/website/library/presets',
    viewPath: '/website/presets/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    listDescription: 'List presets in the platform website library. Super admin adds these for companies to copy.',
    createDescription: `Create one preset in the platform website library. Super-admin only. ${blankDocumentNote} ${suggestNote}`,
    createRequired: ['name'],
    createProperties: presetProperties,
  }),
  ...listAndCreate({
    listName: 'list_design_website_layouts',
    createName: 'create_design_website_layout',
    path: '/api/v1/website/layouts',
    viewPath: '/website/layouts',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    listDescription: 'List layouts on the signed-in company website.',
    createDescription: `Create one layout on the signed-in company website. Company admin only. Do not send header, footer, theme, or page ids. ${suggestNote}`,
    createRequired: ['name'],
    createProperties: layoutProperties,
    defaults: { isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_library_layouts',
    createName: 'create_design_library_layout',
    path: '/api/v1/website/library/layouts',
    viewPath: '/website/layouts',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    listDescription: 'List layouts in the platform website library.',
    createDescription: `Create one layout in the platform website library. Super-admin only. Do not send header, footer, theme, or page ids. ${suggestNote}`,
    createRequired: ['name'],
    createProperties: layoutProperties,
    defaults: { isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_website_themes',
    createName: 'create_design_website_theme',
    path: '/api/v1/website-themes',
    viewPath: '/website/themes/{id}',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    listDescription: 'List themes on the signed-in company website.',
    createDescription: `Create one theme on the signed-in company website. Company admin only. Suggest name, page background, and body text color. Do not send font, color, text style, or button tokens. ${suggestNote}`,
    createRequired: ['name', 'pageBackground', 'bodyTextColor'],
    createProperties: themeProperties,
    defaults: { isActive: true, isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_library_themes',
    createName: 'create_design_library_theme',
    path: '/api/v1/website/library/themes',
    viewPath: '/website/themes/{id}',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    listDescription: 'List themes in the platform website library.',
    createDescription: `Create one theme in the platform website library. Super-admin only. Suggest name, page background, and body text color. Do not send font, color, text style, or button tokens. Fonts in the Font library are added with create_design_font, not on this tool. ${suggestNote}`,
    createRequired: ['name', 'pageBackground', 'bodyTextColor'],
    createProperties: themeProperties,
    defaults: { isActive: true, isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_website_headers',
    createName: 'create_design_website_header',
    path: '/api/v1/website/headers',
    viewPath: '/website/headers/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    listDescription: 'List headers on the signed-in company website.',
    createDescription: `Create one header on the signed-in company website. Company admin only. ${blankDocumentNote} ${suggestNote}`,
    createRequired: ['name'],
    createProperties: chromeProperties,
    defaults: { isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_library_headers',
    createName: 'create_design_library_header',
    path: '/api/v1/website/library/headers',
    viewPath: '/website/headers/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    listDescription: 'List headers in the platform website library.',
    createDescription: `Create one header in the platform website library. Super-admin only. ${blankDocumentNote} ${suggestNote}`,
    createRequired: ['name'],
    createProperties: chromeProperties,
    defaults: { isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_website_footers',
    createName: 'create_design_website_footer',
    path: '/api/v1/website/footers',
    viewPath: '/website/footers/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    listDescription: 'List footers on the signed-in company website.',
    createDescription: `Create one footer on the signed-in company website. Company admin only. ${blankDocumentNote} ${suggestNote}`,
    createRequired: ['name'],
    createProperties: chromeProperties,
    defaults: { isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_library_footers',
    createName: 'create_design_library_footer',
    path: '/api/v1/website/library/footers',
    viewPath: '/website/footers/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    listDescription: 'List footers in the platform website library.',
    createDescription: `Create one footer in the platform website library. Super-admin only. ${blankDocumentNote} ${suggestNote}`,
    createRequired: ['name'],
    createProperties: chromeProperties,
    defaults: { isDefault: false },
  }),
  ...listAndCreate({
    listName: 'list_design_website_datasets',
    createName: 'create_design_website_dataset',
    path: '/api/v1/website/datasets',
    viewPath: '/website/datasets',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    listDescription: 'List data sets on the signed-in company website. Company admin and member.',
    createDescription: `Create one website data set for the signed-in company. Company admin only. Fill name, sourceType, selectedFields, and status. When sourceType is analytics, also set config.dimension. Do not invent record ids. ${suggestNote}`,
    createRequired: ['name', 'sourceType', 'selectedFields'],
    createProperties: datasetProperties,
    defaults: { status: 'active' },
  }),
  designTool({
    name: 'list_design_button_library',
    description:
      'List button styles in the platform Button library. Super admin designs these; company users can only read the list. Call this before updating a button so you copy the id.',
    jsonSchema: listQuerySchema,
    riskLevel: 'read',
    requiredRoles: libraryReadRoles,
    requiredPermissions: ['ai:design:platform:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/website/button-library' },
    viewPath: '/website/buttons/{id}',
  }),
  designTool({
    name: 'get_design_button_library',
    description:
      'Get one platform Button library style by id, including basic settings and customization html, styles, and scripts. Copy the id from list_design_button_library or the attached Design button. Never invent ids.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Button library id from list_design_button_library or attached context.' },
      },
    },
    riskLevel: 'read',
    requiredRoles: libraryReadRoles,
    requiredPermissions: ['ai:design:platform:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/website/button-library/:id' },
    viewPath: '/website/buttons/{id}',
  }),
  designTool({
    name: 'update_design_button_library',
    description:
      `Update one platform Button library style to match the user request. Super-admin only. Call get_design_button_library first. ${elementDesignNote} Send html, styles, and scripts together when the look or behavior changes so the live preview updates. Basic settings such as name, colors, font, text size, border width, and radius may change when the user asked. Fill every property you are changing.`,
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Button library id from get_design_button_library. Never invent this id.' },
        name: nameProperty,
        html: htmlProperty,
        styles: stylesProperty,
        scripts: scriptsProperty,
        definition: {
          type: 'object',
          title: 'Basic settings',
          additionalProperties: false,
          description:
            'Optional basic settings to merge. Send only fields that should change: colors, font, text size, border width, or radius.',
          properties: {
            backgroundColorValue: { type: 'string', title: 'Background color', description: 'Button background as #RRGGBB.' },
            textColorValue: { type: 'string', title: 'Text color', description: 'Label color as #RRGGBB.' },
            borderColorValue: { type: 'string', title: 'Border color', description: 'Border color as #RRGGBB.' },
            labelColorValue: { type: 'string', title: 'Label color', description: 'Label text color as #RRGGBB.' },
            borderWidth: { type: 'number', title: 'Border width', minimum: 0, maximum: 16 },
            radius: { type: 'number', title: 'Radius', minimum: 0, maximum: 999 },
            textSize: { type: 'number', title: 'Text size', minimum: 8, maximum: 200 },
            textFontName: { type: 'string', title: 'Font name' },
            textFontFamily: { type: 'string', title: 'Font family' },
            textGoogleFontUrl: { type: 'string', title: 'Google Font URL' },
          },
        },
      },
    },
    riskLevel: 'write',
    requiredRoles: platformWriteRoles,
    requiredPermissions: ['ai:design:platform:write'],
    auth: 'user_jwt',
    invoke: { method: 'PATCH', path: '/api/v1/website/button-library/:id' },
    viewPath: '/website/buttons/{id}',
    argCompletion: { allowedKeys: ['id', 'name', 'html', 'styles', 'scripts', 'definition'] },
  }),
  designTool({
    name: 'list_design_text_library',
    description:
      'List text styles in the platform Text library. Super admin designs these; company users can only read the list. Call this before updating a text style so you copy the id.',
    jsonSchema: listQuerySchema,
    riskLevel: 'read',
    requiredRoles: libraryReadRoles,
    requiredPermissions: ['ai:design:platform:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/website/text-library' },
    viewPath: '/website/texts/{id}',
  }),
  designTool({
    name: 'get_design_text_library',
    description:
      'Get one platform Text library style by id, including basic settings and customization html, styles, and scripts. Copy the id from list_design_text_library or the attached Design text. Never invent ids.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Text library id from list_design_text_library or attached context.' },
      },
    },
    riskLevel: 'read',
    requiredRoles: libraryReadRoles,
    requiredPermissions: ['ai:design:platform:read'],
    auth: 'user_jwt',
    invoke: { method: 'GET', path: '/api/v1/website/text-library/:id' },
    viewPath: '/website/texts/{id}',
  }),
  designTool({
    name: 'update_design_text_library',
    description:
      `Update one platform Text library style to match the user request. Super-admin only. Call get_design_text_library first. ${elementDesignNote} Send html, styles, and scripts together when the look or behavior changes so the live preview updates. Basic settings such as name, color, font, and size may change when the user asked. Fill every property you are changing.`,
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Text library id from get_design_text_library. Never invent this id.' },
        name: nameProperty,
        html: htmlProperty,
        styles: stylesProperty,
        scripts: scriptsProperty,
        definition: {
          type: 'object',
          title: 'Basic settings',
          additionalProperties: false,
          description:
            'Optional basic settings to merge. Send only fields that should change: font, color, or size.',
          properties: {
            fontName: { type: 'string', title: 'Font name' },
            family: { type: 'string', title: 'Font family' },
            googleFontUrl: { type: 'string', title: 'Google Font URL' },
            colorName: { type: 'string', title: 'Color name' },
            colorValue: { type: 'string', title: 'Color', description: 'Text color as #RRGGBB.' },
            size: { type: 'number', title: 'Size', minimum: 8, maximum: 200 },
          },
        },
      },
    },
    riskLevel: 'write',
    requiredRoles: platformWriteRoles,
    requiredPermissions: ['ai:design:platform:write'],
    auth: 'user_jwt',
    invoke: { method: 'PATCH', path: '/api/v1/website/text-library/:id' },
    viewPath: '/website/texts/{id}',
    argCompletion: { allowedKeys: ['id', 'name', 'html', 'styles', 'scripts', 'definition'] },
  }),
]
