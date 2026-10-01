import { toolRequiresCompanySession } from './filterTools.js'
import type { ToolDefinition, ToolServiceId } from './registry.js'

export type AiToolOperationKind =
  | 'list'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'read'

export type AiSupportedAreaSummary = {
  id: string
  service: ToolServiceId
  operations: AiToolOperationKind[]
  requiresCompany: boolean
  toolCount: number
}

function operationFromToolName(name: string, riskLevel: ToolDefinition['riskLevel']): AiToolOperationKind {
  if (name.startsWith('list_') || name.startsWith('search_') || name === 'discover_companies') {
    return 'list'
  }
  if (name.startsWith('get_')) {
    return 'get'
  }
  if (
    name.startsWith('create_') ||
    name === 'register_company' ||
    name.startsWith('approve_') ||
    name.startsWith('reject_')
  ) {
    return 'create'
  }
  if (name.startsWith('update_') || name.startsWith('set_')) {
    return 'update'
  }
  if (name.startsWith('delete_')) {
    return 'delete'
  }
  if (
    name.startsWith('link_') ||
    name.startsWith('fork_') ||
    name.startsWith('from_library_') ||
    name === 'connect_company'
  ) {
    return 'manage'
  }
  if (riskLevel === 'read') {
    return 'read'
  }
  return 'manage'
}

function areaIdFromTool(tool: ToolDefinition): string {
  const name = tool.name

  const dataLibrary = name.match(
    /^(?:list|get|create|update|delete)_data_(tags?|units?|attributes?|products?|services?|spaces?)(?:_|$)/,
  )
  if (dataLibrary) {
    const resource = dataLibrary[1]
    const plural: Record<string, string> = {
      tag: 'tags',
      tags: 'tags',
      unit: 'units',
      units: 'units',
      attribute: 'attributes',
      attributes: 'attributes',
      product: 'products',
      products: 'products',
      service: 'services',
      services: 'services',
      space: 'spaces',
      spaces: 'spaces',
    }
    return `data.${plural[resource] ?? resource}`
  }

  if (name.includes('public_catalog') || name === 'search_public_catalog') {
    return 'webonone.publicCatalog'
  }

  if (
    name.includes('catalog') ||
    name === 'get_catalog_item' ||
    name === 'create_catalog_item' ||
    name === 'update_catalog_item' ||
    name === 'delete_catalog_item'
  ) {
    return 'webonone.companyCatalog'
  }

  if (name.includes('staff_leave')) {
    return 'webonone.staffLeaves'
  }

  if (name.includes('staff') || name.includes('_staff')) {
    return 'webonone.staff'
  }

  if (name.includes('event')) {
    return 'webonone.events'
  }

  if (
    name.includes('company') ||
    name === 'register_company' ||
    name === 'discover_companies' ||
    name === 'connect_company' ||
    name === 'approve_company'
  ) {
    return 'webonone.companies'
  }

  if (name.startsWith('list_payment_') || name.startsWith('get_payment_')) {
    return 'payment.invoices'
  }

  if (name.startsWith('list_sms_') || name.startsWith('get_sms_')) {
    return 'sms.templates'
  }

  return `${tool.service}.other`
}

const OPERATION_ORDER: AiToolOperationKind[] = [
  'list',
  'get',
  'read',
  'create',
  'update',
  'manage',
  'delete',
]

function sortOperations(ops: Set<AiToolOperationKind>): AiToolOperationKind[] {
  return OPERATION_ORDER.filter((op) => ops.has(op))
}

export function summarizeToolAreas(tools: ToolDefinition[]): AiSupportedAreaSummary[] {
  const byId = new Map<
    string,
    {
      service: ToolServiceId
      operations: Set<AiToolOperationKind>
      requiresCompany: boolean
      toolCount: number
    }
  >()

  for (const tool of tools) {
    const id = areaIdFromTool(tool)
    const existing = byId.get(id)
    const operations = existing?.operations ?? new Set<AiToolOperationKind>()
    operations.add(operationFromToolName(tool.name, tool.riskLevel))
    const requiresCompany =
      (existing?.requiresCompany ?? false) || toolRequiresCompanySession(tool)
    byId.set(id, {
      service: tool.service,
      operations,
      requiresCompany,
      toolCount: (existing?.toolCount ?? 0) + 1,
    })
  }

  return [...byId.entries()]
    .map(([id, entry]) => ({
      id,
      service: entry.service,
      operations: sortOperations(entry.operations),
      requiresCompany: entry.requiresCompany,
      toolCount: entry.toolCount,
    }))
    .sort((a, b) => {
      if (a.service !== b.service) {
        return a.service.localeCompare(b.service)
      }
      return a.id.localeCompare(b.id)
    })
}
