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
  'Do not send a document. The designer starts blank and the user lays it out after confirm. If a designer is already open, change that canvas with apply_design_canvas or apply_design_library_canvas instead of creating another record.'

const suggestNote =
  'When the user asks to add or suggest items without naming each one, suggest several that fit and are not already in the list. Call the matching list tool first. One create call per item. Fill every published property. Do not invent ids. Existing names are skipped.'

const stringId = { type: 'string', minLength: 8, maxLength: 32 }

const elementDesignNote =
  'Change only basic settings plus html, styles, and scripts. Omitted fields stay as they are. Keep {{label}} on buttons and {{content}} on text. For buttons the root tag MUST be <button type="button"> — never wrap it in a div. Put website-element-root, website-el-{id}, data-website-element="button", Tailwind utilities, and basic-setting CSS variables (--el-bg, --el-color, --el-border, --el-radius, --el-font-family, --el-font-size, --el-line-height, plus --el-color-1 … --el-color-6 from the selected palette) on that button. Scripts run in live preview: use root or document.querySelector, setTimeout, and var(--el-color-N). Styles MUST include a .website-el-{id} { } rule using the attached id. Do not invent a new id. Do not send page, theme, layout, or document fields.'

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
    title: 'Main text color',
    description: 'Headings and body text default as #RRGGBB. Keep it readable on the page background.',
  },
  colorRoles: {
    type: 'object',
    title: 'Palette color roles',
    description:
      'Theme Basic settings colors picked from the selected palette: pageBackgroundColorId, surfaceColorId, bodyTextColorId, accentColor1Id, accentColor2Id. Each value is a color token id from the theme palette.',
    properties: {
      pageBackgroundColorId: { type: 'string', title: 'Page background color id' },
      surfaceColorId: { type: 'string', title: 'Surface color id' },
      bodyTextColorId: { type: 'string', title: 'Main text color id' },
      accentColor1Id: { type: 'string', title: 'Accent color 1 id' },
      accentColor2Id: { type: 'string', title: 'Accent color 2 id' },
    },
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

const canvasOperationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['op'],
  properties: {
    op: {
      type: 'string',
      enum: ['add_block', 'add_addon', 'update_text', 'update_button', 'update_menu', 'rename', 'place_block', 'move', 'delete_block', 'delete_addon'],
      description:
        'Create: add_block, add_addon. Read ids and names from the latest canvas outline. Update content: update_text, update_button, update_menu. Rename an existing block or add-on: rename with its id and the new name. Move or resize on the canvas grid: move with the id and col, row, cols, or rows. place_block only slides a block to start, center, or end. Delete: delete_block, delete_addon. Do not recreate an element to rename or edit it.',
    },
    type: {
      type: 'string',
      enum: ['text', 'button', 'image', 'slider', 'menu'],
      description:
        'Required for add_addon. Use text for a name, contact lines, a link list, or copyright. Use image for a logo. Use menu with items for page links.',
    },
    name: {
      type: 'string',
      maxLength: 64,
      description:
        'Content-tree name. Required on add_block, add_addon, and rename. On rename, put the new name here. text is also accepted as that new name. This replaces the existing name and leaves the element in place. Use a short content name such as Contact us or Address. Do not use Block, Text, Button, Image, Slider, or Menu.',
    },
    blockId: {
      type: 'string',
      description:
        'Block id from the canvas outline. On add_block with group true, the section this group goes inside. Omit to use the newest section. Never invent ids.',
    },
    addonId: {
      type: 'string',
      description:
        'Add-on id from the canvas outline. Required for delete_addon. On rename, set this to rename that add-on. Optional on update_text, update_button, and update_menu when blockId is set.',
    },
    align: {
      type: 'string',
      enum: ['start', 'center', 'end'],
      description: 'place_block only. end is the right side, start is the left, center is the middle. Use the existing blockId.',
    },
    col: {
      type: 'integer',
      minimum: 1,
      maximum: 12,
      description:
        'move only. First column, from 1 to 12. Omit to keep the current column. A root block uses the page grid. An add-on or nested block uses that parent block’s 12 columns.',
    },
    row: {
      type: 'integer',
      minimum: 0,
      maximum: 200,
      description: 'move only. First grid row, starting at 0. Omit to keep the current row. Read the current row from the outline.',
    },
    cols: {
      type: 'integer',
      minimum: 1,
      maximum: 12,
      description: 'move only. Width in columns. Omit to keep the current width.',
    },
    rows: {
      type: 'integer',
      minimum: 1,
      maximum: 80,
      description:
        'move only. Height in grid rows. Omit to keep the current height. A block stays tall enough for the elements inside it.',
    },
    text: {
      type: 'string',
      description: 'Text content, or the button label. Required for update_text and update_button. Optional on add_addon.',
    },
    items: {
      type: 'array',
      items: { type: 'string' },
      description: 'Menu labels. Use on add_addon type menu or update_menu.',
    },
    group: {
      type: 'boolean',
      description:
        'add_block only. True nests a small group inside the current section. That group must then get at least two related add_addon operations. Omit when starting a new full-width section.',
    },
    span: {
      type: 'string',
      enum: ['full', 'half', 'third', 'quarter'],
      description:
        'Do not send span. Width and height are taken from the content so the box has no empty space.',
    },
    role: {
      type: 'string',
      enum: ['heading', 'body'],
      description: 'Text only. heading is larger and shorter; body is smaller. Sizes step down on sm and md.',
    },
  },
}

const canvasToolSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'operations'],
  properties: {
    name: {
      type: 'string',
      title: 'Change',
      description: 'Short label for this canvas change, for example Add hero section.',
    },
    operations: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: canvasOperationSchema,
      description:
        'Ordered canvas edits. Create with add_block and add_addon, each with name. Rename an existing block or add-on with rename, its id from the outline, and the new name. Update content with update_text, update_button, or update_menu. Move or resize with move: copy the id and send col, row, cols, or rows from the canvas grid. place_block only sets align start, center, or end. Delete with delete_block or delete_addon. Do not recreate an element to change its name. New sections still use add_block, then group true, then at least two related add_addon calls. Do not send span.',
    },
  },
}

const canvasToolDescription =
  'Change the website designer canvas that is already open. Use this when the user asks to add, edit, or remove a heading, paragraph, button, image, slider, menu, or block on the current page, header, footer, or preset. Do not create a new page, header, footer, preset, layout, or theme for that request. The designer-canvas outline in the latest user message is the only current canvas, including manual edits. Ignore every earlier outline. Copy blockId and addonId from that latest outline. Never invent ids. Canvas CRUD uses this one tool. Create with add_block and add_addon. Read ids and current names from the latest outline. Update text, a button label, or menu items with update_text, update_button, or update_menu. Rename an existing block or add-on with rename, copying its blockId or addonId from the outline and sending the new name. Do not recreate it and do not use update_text only to change the tree name. Move or resize an existing block or add-on with move. The canvas is a 12-column grid. Each outline line shows col, cols, row, and rows. Copy that id. Set col and row to place it, cols for width, and rows for height. Omit a field to keep the current value. The named element keeps that cell and size. If another element would overlap it, that other element moves to the next free cell. place_block only sets align start, center, or end. Delete with delete_block or delete_addon. Leave every element the user did not mention as it is now, except an element that would cover the one just placed. blockId is enough for an edit. Add or delete only when the user wants new structure. Build new content from small groups. add_block starts a section sized to its content. Each following add_block with group true is one small group inside that section and must contain at least two related elements. Prefer several small groups over one flat list. Each parent takes its width and height from its children so text and buttons are fully visible. Showing the full content comes before a tight box. Do not send span. Use move when the user asks for a grid cell, a width, or a height. add_addon needs type and is placed inside the current group. Every new block and add-on needs name, a short label for the content tree, such as Contact us or Address. Do not name an element Block, Text, Button, Image, Slider, or Menu. Set role heading or body on text. Images are empty until the user picks media. One call can hold several operations. The user confirms once, the canvas updates, and they still press Save in the designer.'

function canvasTool(name: string, roles: ToolDefinition['requiredRoles'], permission: string): ToolDefinition {
  return designTool({
    name,
    description: canvasToolDescription,
    jsonSchema: canvasToolSchema,
    riskLevel: 'write',
    requiredRoles: roles,
    requiredPermissions: [permission],
    auth: 'user_jwt',
    invoke: { method: 'POST', path: '/api/v1/website/designer/canvas' },
    argCompletion: { allowedKeys: ['name', 'operations'] },
  })
}

function recordTools(options: {
  name: string
  path: string
  viewPath?: string
  readRoles: ToolDefinition['requiredRoles']
  writeRoles: ToolDefinition['requiredRoles']
  readPermission: string
  writePermission: string
  noun: string
  updateProperties: Record<string, unknown>
  updateKeys: string[]
  includeGet?: boolean
  updateDescription?: string
}): ToolDefinition[] {
  const idSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: { ...stringId, description: `${options.noun} id from the matching list tool or the open designer. Never invent this id.` },
    },
  }
  const tools: ToolDefinition[] = []
  if (options.includeGet !== false) {
    tools.push(
      designTool({
        name: `get_${options.name}`,
        description: `Get one ${options.noun} by id, including its saved fields. Copy the id from the matching list tool. Never invent ids. Do not use this to edit the open canvas; use apply_design_canvas for elements on the canvas.`,
        jsonSchema: idSchema,
        riskLevel: 'read',
        requiredRoles: options.readRoles,
        requiredPermissions: [options.readPermission],
        auth: 'user_jwt',
        invoke: { method: 'GET', path: `${options.path}/:id` },
        ...(options.viewPath ? { viewPath: options.viewPath } : {}),
      }),
    )
  }
  tools.push(
    designTool({
      name: `update_${options.name}`,
        description:
          options.updateDescription ??
          `Update one ${options.noun}. Copy the id from the matching list or get tool. Send only fields the user asked to change. Do not send a document. Canvas elements use apply_design_canvas. Fill every property you are changing.`,
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: {
          id: idSchema.properties.id,
          ...options.updateProperties,
        },
      },
      riskLevel: 'write',
      requiredRoles: options.writeRoles,
      requiredPermissions: [options.writePermission],
      auth: 'user_jwt',
      invoke: { method: 'PATCH', path: `${options.path}/:id` },
      argCompletion: { allowedKeys: ['id', ...options.updateKeys] },
      ...(options.viewPath ? { viewPath: options.viewPath } : {}),
    }),
    designTool({
      name: `delete_${options.name}`,
      description: `Delete one ${options.noun}. Copy the id from the matching list tool. Never invent ids. Do not use this to remove an element from the open canvas; use apply_design_canvas delete_block or delete_addon.`,
      jsonSchema: idSchema,
      riskLevel: 'destructive',
      requiredRoles: options.writeRoles,
      requiredPermissions: [options.writePermission],
      auth: 'user_jwt',
      invoke: { method: 'DELETE', path: `${options.path}/:id` },
      ...(options.viewPath ? { viewPath: options.viewPath } : {}),
    }),
  )
  return tools
}

const pageUpdateProperties = {
  name: nameProperty,
  path: pageProperties.path,
  status: pageProperties.status,
}

const themeUpdateProperties = {
  name: nameProperty,
  pageBackground: themeProperties.pageBackground,
  bodyTextColor: themeProperties.bodyTextColor,
  isActive: themeProperties.isActive,
  isDefault: themeProperties.isDefault,
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
            textColorValue: { type: 'string', title: 'Text color', description: 'Button label text as #RRGGBB.' },
            borderColorValue: { type: 'string', title: 'Border color', description: 'Border color as #RRGGBB.' },
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
  canvasTool('apply_design_canvas', ['company_admin', 'super_admin'], 'ai:design:write'),
  canvasTool('apply_design_library_canvas', platformWriteRoles, 'ai:design:platform:write'),
  ...recordTools({
    name: 'design_website_page',
    path: '/api/v1/website/pages',
    viewPath: '/website/pages/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    noun: 'company website page',
    updateProperties: pageUpdateProperties,
    updateKeys: ['name', 'path', 'status'],
  }),
  ...recordTools({
    name: 'design_library_page',
    path: '/api/v1/website/library/pages',
    viewPath: '/website/pages/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    noun: 'platform library page',
    updateProperties: pageUpdateProperties,
    updateKeys: ['name', 'path', 'status'],
  }),
  ...recordTools({
    name: 'design_website_preset',
    path: '/api/v1/website/presets',
    viewPath: '/website/presets/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    noun: 'company website preset',
    updateProperties: { name: nameProperty },
    updateKeys: ['name'],
  }),
  ...recordTools({
    name: 'design_library_preset',
    path: '/api/v1/website/library/presets',
    viewPath: '/website/presets/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    noun: 'platform library preset',
    updateProperties: { name: nameProperty },
    updateKeys: ['name'],
  }),
  ...recordTools({
    name: 'design_website_layout',
    path: '/api/v1/website/layouts',
    viewPath: '/website/layouts',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    noun: 'company website layout',
    updateProperties: { name: nameProperty, isDefault: layoutProperties.isDefault },
    updateKeys: ['name', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_library_layout',
    path: '/api/v1/website/library/layouts',
    viewPath: '/website/layouts',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    noun: 'platform library layout',
    updateProperties: { name: nameProperty, isDefault: layoutProperties.isDefault },
    updateKeys: ['name', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_website_theme',
    path: '/api/v1/website-themes',
    viewPath: '/website/themes/{id}',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    noun: 'company website theme',
    updateProperties: themeUpdateProperties,
    updateKeys: ['name', 'pageBackground', 'bodyTextColor', 'isActive', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_library_theme',
    path: '/api/v1/website/library/themes',
    viewPath: '/website/themes/{id}',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    noun: 'platform library theme',
    updateProperties: themeUpdateProperties,
    updateKeys: ['name', 'pageBackground', 'bodyTextColor', 'isActive', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_website_header',
    path: '/api/v1/website/headers',
    viewPath: '/website/headers/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    noun: 'company website header',
    updateProperties: chromeProperties,
    updateKeys: ['name', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_library_header',
    path: '/api/v1/website/library/headers',
    viewPath: '/website/headers/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    noun: 'platform library header',
    updateProperties: chromeProperties,
    updateKeys: ['name', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_website_footer',
    path: '/api/v1/website/footers',
    viewPath: '/website/footers/{id}/edit',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    noun: 'company website footer',
    updateProperties: chromeProperties,
    updateKeys: ['name', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_library_footer',
    path: '/api/v1/website/library/footers',
    viewPath: '/website/footers/{id}/edit',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    noun: 'platform library footer',
    updateProperties: chromeProperties,
    updateKeys: ['name', 'isDefault'],
  }),
  ...recordTools({
    name: 'design_website_dataset',
    path: '/api/v1/website/datasets',
    viewPath: '/website/datasets',
    readRoles: companyReadRoles,
    writeRoles: companyWriteRoles,
    readPermission: 'ai:design:read',
    writePermission: 'ai:design:write',
    noun: 'company website data set',
    updateProperties: {
      name: nameProperty,
      sourceType: datasetProperties.sourceType,
      selectedFields: datasetProperties.selectedFields,
      status: datasetProperties.status,
      config: datasetProperties.config,
    },
    updateKeys: ['name', 'sourceType', 'selectedFields', 'status', 'config'],
  }),
  ...recordTools({
    name: 'design_font',
    path: '/api/v1/website/font-library',
    viewPath: '/website/fonts',
    readRoles: libraryReadRoles,
    writeRoles: platformWriteRoles,
    readPermission: 'ai:design:platform:read',
    writePermission: 'ai:design:platform:write',
    noun: 'platform font',
    includeGet: false,
    updateProperties: fontProperties,
    updateKeys: ['name', 'family', 'googleFontUrl'],
    updateDescription:
      'Update one platform font. Super-admin only. Copy the id from list_design_fonts. Send name, family, and googleFontUrl together. Do not invent ids.',
  }),
  designTool({
    name: 'delete_design_button_library',
    description:
      'Delete one platform Button library style. Super-admin only. Copy the id from list_design_button_library. Never invent ids.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Button library id from list_design_button_library. Never invent this id.' },
      },
    },
    riskLevel: 'destructive',
    requiredRoles: platformWriteRoles,
    requiredPermissions: ['ai:design:platform:write'],
    auth: 'user_jwt',
    invoke: { method: 'DELETE', path: '/api/v1/website/button-library/:id' },
    viewPath: '/website/buttons/{id}',
  }),
  designTool({
    name: 'delete_design_text_library',
    description:
      'Delete one platform Text library style. Super-admin only. Copy the id from list_design_text_library. Never invent ids.',
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { ...stringId, description: 'Text library id from list_design_text_library. Never invent this id.' },
      },
    },
    riskLevel: 'destructive',
    requiredRoles: platformWriteRoles,
    requiredPermissions: ['ai:design:platform:write'],
    auth: 'user_jwt',
    invoke: { method: 'DELETE', path: '/api/v1/website/text-library/:id' },
    viewPath: '/website/texts/{id}',
  }),
]
