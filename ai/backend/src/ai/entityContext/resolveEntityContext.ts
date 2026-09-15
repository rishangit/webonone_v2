import type { AiRequestContext } from '../requestContext.js'
import type { ToolExecutor, ToolRegistry } from '../tools/registry.js'
import type {
  CatalogEntityKind,
  DataEntityContextRef,
  DataEntityKind,
  EntityContextRef,
  ResolvedEntityContext,
  WebononeEntityContextRef,
  WebononeEntityKind,
} from './types.js'

const GET_TOOL_BY_KIND: Record<DataEntityKind, string> = {
  product: 'get_data_product',
  service: 'get_data_service',
  space: 'get_data_space',
  tag: 'get_data_tag',
  unit: 'get_data_unit',
  attribute: 'get_data_attribute',
}

const UPDATE_TOOL_BY_KIND: Record<DataEntityKind, string> = {
  product: 'update_data_product',
  service: 'update_data_service',
  space: 'update_data_space',
  tag: 'update_data_tag',
  unit: 'update_data_unit',
  attribute: 'update_data_attribute',
}

const LIST_TOOL_BY_KIND: Partial<Record<DataEntityKind, string>> = {
  product: 'list_data_products',
  service: 'list_data_services',
  space: 'list_data_spaces',
  tag: 'list_data_tags',
  unit: 'list_data_units',
  attribute: 'list_data_attributes',
}

const CATALOG_KIND_API: Record<CatalogEntityKind, string> = {
  product: 'products',
  service: 'services',
  space: 'spaces',
}

const GET_CATALOG_ITEM_TOOL = 'get_catalog_item'
const UPDATE_CATALOG_ITEM_TOOL = 'update_catalog_item'
const SEARCH_COMPANY_CATALOG_TOOL = 'search_company_catalog'

const WEBONONE_GET_TOOL_BY_KIND: Record<WebononeEntityKind, string> = {
  product: GET_CATALOG_ITEM_TOOL,
  service: GET_CATALOG_ITEM_TOOL,
  space: GET_CATALOG_ITEM_TOOL,
  staff: 'get_staff',
  event: 'get_event',
  company: 'get_company',
}

const WEBONONE_UPDATE_TOOL_BY_KIND: Partial<Record<WebononeEntityKind, string>> = {
  product: UPDATE_CATALOG_ITEM_TOOL,
  service: UPDATE_CATALOG_ITEM_TOOL,
  space: UPDATE_CATALOG_ITEM_TOOL,
  staff: 'update_staff',
  event: 'update_event',
  company: 'update_company',
}

const WEBONONE_LIST_TOOL_BY_KIND: Partial<Record<WebononeEntityKind, string>> = {
  product: SEARCH_COMPANY_CATALOG_TOOL,
  service: SEARCH_COMPANY_CATALOG_TOOL,
  space: SEARCH_COMPANY_CATALOG_TOOL,
  staff: 'list_staff',
  event: 'list_events',
  company: 'list_my_companies',
}

function isCatalogEntityKind(kind: WebononeEntityKind): kind is CatalogEntityKind {
  return kind === 'product' || kind === 'service' || kind === 'space'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function recordFromToolOutput(output: unknown): Record<string, unknown> | undefined {
  if (isRecord(output)) {
    return output
  }
  return undefined
}

export function getToolNameForDataEntityKind(kind: DataEntityKind): string {
  return GET_TOOL_BY_KIND[kind]
}

export function getUpdateToolNameForDataEntityKind(kind: DataEntityKind): string {
  return UPDATE_TOOL_BY_KIND[kind]
}

function relatedName(value: unknown): string | null {
  if (!isRecord(value)) {
    return null
  }
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  return name || null
}

const ATTRIBUTE_VALUE_CREATE_TOOL_BY_KIND: Partial<Record<DataEntityKind, string>> = {
  product: 'create_data_product_attribute_value',
  service: 'create_data_service_attribute_value',
  space: 'create_data_space_attribute_value',
}

function summarizeRelatedFromDataRecord(kind: DataEntityKind, record: Record<string, unknown>): string {
  const lines: string[] = []

  if (kind === 'product' || kind === 'service' || kind === 'space') {
    const tags = Array.isArray(record.tags) ? record.tags : []
    const tagNames = tags.map(relatedName).filter((name): name is string => Boolean(name))
    lines.push(`tags (${tagNames.length}): ${tagNames.length > 0 ? tagNames.join(', ') : 'none'}`)

    const attributes = Array.isArray(record.attributes) ? record.attributes : []
    const attributeSummaries = attributes
      .map((entry) => {
        if (!isRecord(entry)) return null
        const name = relatedName(entry)
        const attributeId =
          typeof entry.attribute_id === 'string'
            ? entry.attribute_id
            : typeof entry.attributeId === 'string'
              ? entry.attributeId
              : null
        const values = Array.isArray(entry.values) ? entry.values : []
        const valueCount = values.length
        if (!name) return null
        return attributeId
          ? `${name} (attribute_id: ${attributeId}, ${valueCount} value${valueCount === 1 ? '' : 's'})`
          : `${name} (${valueCount} value${valueCount === 1 ? '' : 's'})`
      })
      .filter((line): line is string => Boolean(line))
    lines.push(
      `attributes (${attributeSummaries.length}): ${attributeSummaries.length > 0 ? attributeSummaries.join('; ') : 'none'}`,
    )

    const valueTool = ATTRIBUTE_VALUE_CREATE_TOOL_BY_KIND[kind]
    if (valueTool) {
      lines.push(`attribute values: use ${valueTool} with this id and attributeId from the attributes array`)
    }
  }

  if (kind === 'attribute') {
    const unit = relatedName(record.unit)
    lines.push(`unit: ${unit ?? 'none'}`)
  }

  if (kind === 'unit') {
    const baseUnit = relatedName(record.base_unit)
    lines.push(`base_unit: ${baseUnit ?? 'none'}`)
  }

  return lines.length > 0 ? `Current related: ${lines.join('; ')}` : 'Current related: none listed'
}

function summarizeCompanyCatalogRecord(record: Record<string, unknown>): string {
  const lines: string[] = []
  const bindingMode =
    typeof record.bindingMode === 'string'
      ? record.bindingMode
      : typeof record.binding_mode === 'string'
        ? record.binding_mode
        : null
  if (bindingMode) {
    lines.push(`binding: ${bindingMode}`)
  }
  if (record.listPrice != null || record.list_price != null) {
    lines.push(`list_price: ${String(record.listPrice ?? record.list_price)}`)
  }
  const libraryEntityId =
    typeof record.libraryEntityId === 'string'
      ? record.libraryEntityId
      : typeof record.library_entity_id === 'string'
        ? record.library_entity_id
        : null
  if (libraryEntityId) {
    lines.push(`library_entity_id: ${libraryEntityId}`)
  }
  return lines.length > 0 ? `Company catalog: ${lines.join('; ')}` : 'Company catalog: no extra summary'
}

async function resolveDataEntityRef(
  ref: DataEntityContextRef,
  options: {
    registry: ToolRegistry | undefined
    executor: ToolExecutor | undefined
    ctx: Pick<AiRequestContext, 'role' | 'permissions' | 'companyId' | 'accessToken'>
  },
): Promise<ResolvedEntityContext> {
  const { registry, executor, ctx } = options
  const toolName = getToolNameForDataEntityKind(ref.kind)
  const tool = registry?.get(toolName)
  if (!tool || !executor) {
    return { ref, error: 'Entity lookup unavailable' }
  }

  const result = await executor.execute(
    { id: `ctx:data:${ref.kind}:${ref.id}`, name: toolName, arguments: { id: ref.id } },
    ctx,
    { confirmed: true },
  )

  if (!result.ok) {
    const code =
      isRecord(result.output) && typeof result.output.code === 'string'
        ? result.output.code
        : 'LOOKUP_FAILED'
    return { ref, error: code }
  }

  const record = recordFromToolOutput(result.output)
  if (!record) {
    return { ref, error: 'EMPTY_RECORD' }
  }

  return { ref, record }
}

async function resolveWebononeEntityRef(
  ref: WebononeEntityContextRef,
  options: {
    registry: ToolRegistry | undefined
    executor: ToolExecutor | undefined
    ctx: Pick<AiRequestContext, 'role' | 'permissions' | 'companyId' | 'accessToken'>
  },
): Promise<ResolvedEntityContext> {
  const { registry, executor, ctx } = options
  const toolName = WEBONONE_GET_TOOL_BY_KIND[ref.kind]
  const tool = registry?.get(toolName)
  if (!tool || !executor) {
    return { ref, error: 'Entity lookup unavailable' }
  }

  const argumentsPayload: Record<string, unknown> = { id: ref.id }
  if (isCatalogEntityKind(ref.kind)) {
    argumentsPayload.kind = CATALOG_KIND_API[ref.kind]
  }

  const result = await executor.execute(
    {
      id: `ctx:webonone:${ref.kind}:${ref.id}`,
      name: toolName,
      arguments: argumentsPayload,
    },
    ctx,
    { confirmed: true },
  )

  if (!result.ok) {
    const code =
      isRecord(result.output) && typeof result.output.code === 'string'
        ? result.output.code
        : 'LOOKUP_FAILED'
    return { ref, error: code }
  }

  const record = recordFromToolOutput(result.output)
  if (!record) {
    return { ref, error: 'EMPTY_RECORD' }
  }

  return { ref, record }
}

export async function resolveEntityContext(
  refs: EntityContextRef[],
  options: {
    registry: ToolRegistry | undefined
    executor: ToolExecutor | undefined
    ctx: Pick<AiRequestContext, 'role' | 'permissions' | 'companyId' | 'accessToken'>
  },
): Promise<ResolvedEntityContext[]> {
  const results: ResolvedEntityContext[] = []

  for (const ref of refs) {
    if (ref.service === 'data') {
      results.push(await resolveDataEntityRef(ref, options))
      continue
    }
    if (ref.service === 'webonone') {
      results.push(await resolveWebononeEntityRef(ref, options))
      continue
    }
    results.push({ ref, error: 'Unsupported entity service' })
  }

  return results
}

function formatDataEntityBlock(item: ResolvedEntityContext & { ref: DataEntityContextRef }): string {
  const label = item.ref.label?.trim() || item.ref.kind
  if (item.record) {
    const relatedSummary = summarizeRelatedFromDataRecord(item.ref.kind, item.record)
    const updateTool = getUpdateToolNameForDataEntityKind(item.ref.kind)
    const listTool = LIST_TOOL_BY_KIND[item.ref.kind]
    return `--- Data ${item.ref.kind}: ${label} (id: ${item.ref.id}) ---\n${relatedSummary}\nUpdate tool: ${updateTool}${listTool ? `\nList tool: ${listTool}` : ''}\n${JSON.stringify(item.record, null, 2)}`
  }
  return `--- Data ${item.ref.kind}: ${label} (id: ${item.ref.id}) ---\nLookup failed: ${item.error ?? 'UNKNOWN'}`
}

function formatWebononeEntityBlock(
  item: ResolvedEntityContext & { ref: WebononeEntityContextRef },
): string {
  const label = item.ref.label?.trim() || item.ref.kind
  const getTool = WEBONONE_GET_TOOL_BY_KIND[item.ref.kind]
  const updateTool = WEBONONE_UPDATE_TOOL_BY_KIND[item.ref.kind]
  const listTool = WEBONONE_LIST_TOOL_BY_KIND[item.ref.kind]

  if (isCatalogEntityKind(item.ref.kind)) {
    const catalogKind = CATALOG_KIND_API[item.ref.kind]
    if (item.record) {
      const summary = summarizeCompanyCatalogRecord(item.record)
      return `--- Company ${item.ref.kind}: ${label} (company catalog id: ${item.ref.id}; kind: ${catalogKind}) ---\n${summary}\nRead tool: ${getTool}\nUpdate tool: ${UPDATE_CATALOG_ITEM_TOOL} (forked/custom only; linked items are read-only until forked)\nList tool: ${SEARCH_COMPANY_CATALOG_TOOL}\n${JSON.stringify(item.record, null, 2)}`
    }
    return `--- Company ${item.ref.kind}: ${label} (company catalog id: ${item.ref.id}) ---\nLookup failed: ${item.error ?? 'UNKNOWN'}`
  }

  if (item.record) {
    const updateLine = updateTool ? `\nUpdate tool: ${updateTool}` : ''
    const listLine = listTool ? `\nList tool: ${listTool}` : ''
    return `--- WebOnOne ${item.ref.kind}: ${label} (id: ${item.ref.id}) ---\nRead tool: ${getTool}${updateLine}${listLine}\n${JSON.stringify(item.record, null, 2)}`
  }
  return `--- WebOnOne ${item.ref.kind}: ${label} (id: ${item.ref.id}) ---\nLookup failed: ${item.error ?? 'UNKNOWN'}`
}

export function formatEntityContextSupplement(resolved: ResolvedEntityContext[]): string {
  if (resolved.length === 0) {
    return ''
  }

  const blocks = resolved.map((item) => {
    if (item.ref.service === 'webonone') {
      return formatWebononeEntityBlock(item as ResolvedEntityContext & { ref: WebononeEntityContextRef })
    }
    return formatDataEntityBlock(item as ResolvedEntityContext & { ref: DataEntityContextRef })
  })

  const dataInstructions = [
    'When the user asks to suggest, add, fill, attach, or link missing related items on an attached Data library record:',
    '- Call the matching update_data_* tool with the attached id (never prose-only suggestions for addable items).',
    '- Include only new related names in tags or attributes; existing links are preserved automatically.',
    '- List matching list_data_* tools first to match existing library records before inventing new names.',
    '- For number attributes, suggest units relevant to the item domain (not unrelated units such as bpm for a dressing).',
    '- Write tools park Confirm/Skip rows; missing related records appear as nested checkboxes under the parent row.',
    '- When the user asks to suggest or add attribute values on an attached product, service, or space, call create_data_*_attribute_value once per value with the attached id and attributeId from get_data_*.',
    '- When the user asks to suggest or add market variants on an attached product, call list_data_product_variants and get_data_product first, ensure attributes and labeled attribute values exist, then call create_data_product_variant once per retail SKU with name, sku, kind, and attribute_value_ids from get_data_product. Skip existing combinations. Confirm rows must show name and sku — not bare attribute ids or orphan numbers.',
    '- When the user asks about stocks on a product variant, call list_data_product_variant_stocks with the product id and variantId, then create_data_product_variant_stock for new batches (quantity, batch_number, cost_price, sell_price, purchase_date).',
  ].join('\n')

  const companyInstructions = [
    'When the user asks about an attached company catalog product, service, or space:',
    '- Use get_catalog_item / search_company_catalog with the company catalog id and plural kind (products, services, spaces).',
    '- Use update_catalog_item only for forked or custom company items; linked items must be forked first.',
    '- For Data library attribute values on a linked library entity, use the library_entity_id with create_data_*_attribute_value when appropriate.',
    '- For Data library product variants on a linked library entity, use the library_entity_id with list_data_product_variants and create_data_product_variant.',
    'When the user asks about an attached staff member, calendar event, or company profile:',
    '- Use get_staff / get_event / get_company with the attached id.',
    '- Use the matching update_* tool when the user asks to change fields; write tools park Confirm/Skip rows.',
  ].join('\n')

  return `Attached records (authoritative; use these ids and fields when answering or calling tools):\n\n${blocks.join('\n\n')}\n\n${dataInstructions}\n\n${companyInstructions}`
}
