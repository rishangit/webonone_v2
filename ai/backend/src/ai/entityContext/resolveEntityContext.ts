import type { AiRequestContext } from '../requestContext.js'
import type { ToolExecutor, ToolRegistry } from '../tools/registry.js'
import type { DataEntityContextRef, DataEntityKind, ResolvedEntityContext } from './types.js'

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

function summarizeRelatedFromRecord(kind: DataEntityKind, record: Record<string, unknown>): string {
  const lines: string[] = []

  if (kind === 'product' || kind === 'service' || kind === 'space') {
    const tags = Array.isArray(record.tags) ? record.tags : []
    const tagNames = tags.map(relatedName).filter((name): name is string => Boolean(name))
    lines.push(`tags (${tagNames.length}): ${tagNames.length > 0 ? tagNames.join(', ') : 'none'}`)

    const attributes = Array.isArray(record.attributes) ? record.attributes : []
    const attributeNames = attributes.map(relatedName).filter((name): name is string => Boolean(name))
    lines.push(
      `attributes (${attributeNames.length}): ${attributeNames.length > 0 ? attributeNames.join(', ') : 'none'}`,
    )
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

export async function resolveEntityContext(
  refs: DataEntityContextRef[],
  options: {
    registry: ToolRegistry | undefined
    executor: ToolExecutor | undefined
    ctx: Pick<AiRequestContext, 'role' | 'permissions' | 'companyId' | 'accessToken'>
  },
): Promise<ResolvedEntityContext[]> {
  const { registry, executor, ctx } = options
  const results: ResolvedEntityContext[] = []

  for (const ref of refs) {
    if (ref.service !== 'data') {
      results.push({ ref, error: 'Unsupported entity service' })
      continue
    }

    const toolName = getToolNameForDataEntityKind(ref.kind)
    const tool = registry?.get(toolName)
    if (!tool || !executor) {
      results.push({ ref, error: 'Entity lookup unavailable' })
      continue
    }

    const result = await executor.execute(
      { id: `ctx:${ref.kind}:${ref.id}`, name: toolName, arguments: { id: ref.id } },
      ctx,
      { confirmed: true },
    )

    if (!result.ok) {
      const code =
        isRecord(result.output) && typeof result.output.code === 'string'
          ? result.output.code
          : 'LOOKUP_FAILED'
      results.push({ ref, error: code })
      continue
    }

    const record = recordFromToolOutput(result.output)
    if (!record) {
      results.push({ ref, error: 'EMPTY_RECORD' })
      continue
    }

    results.push({ ref, record })
  }

  return results
}

export function formatEntityContextSupplement(resolved: ResolvedEntityContext[]): string {
  if (resolved.length === 0) {
    return ''
  }

  const blocks: string[] = []
  for (const item of resolved) {
    const label = item.ref.label?.trim() || item.ref.kind
    if (item.record) {
      const relatedSummary = summarizeRelatedFromRecord(item.ref.kind, item.record)
      const updateTool = getUpdateToolNameForDataEntityKind(item.ref.kind)
      const listTool = LIST_TOOL_BY_KIND[item.ref.kind]
      blocks.push(
        `--- Data ${item.ref.kind}: ${label} (id: ${item.ref.id}) ---\n${relatedSummary}\nUpdate tool: ${updateTool}${listTool ? `\nList tool: ${listTool}` : ''}\n${JSON.stringify(item.record, null, 2)}`,
      )
    } else if (item.error) {
      blocks.push(
        `--- Data ${item.ref.kind}: ${label} (id: ${item.ref.id}) ---\nLookup failed: ${item.error}`,
      )
    }
  }

  const instructions = [
    'When the user asks to suggest, add, fill, attach, or link missing related items on an attached record:',
    '- Call the matching update_data_* tool with the attached id (never prose-only suggestions for addable items).',
    '- Include only new related names in tags or attributes; existing links are preserved automatically.',
    '- List matching list_data_* tools first to match existing library records before inventing new names.',
    '- For number attributes, suggest units relevant to the item domain (not unrelated units such as bpm for a dressing).',
    '- Write tools park Confirm/Skip rows; missing related records appear as nested checkboxes under the parent row.',
  ].join('\n')

  return `Attached Data library records (authoritative; use these ids and fields when answering or calling tools):\n\n${blocks.join('\n\n')}\n\n${instructions}`
}
