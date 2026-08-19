export type ToolRiskLevel = 'read' | 'write' | 'destructive'
export type ToolAuth = 'user_jwt' | 'service_key'
export type ToolServiceId = 'webonone' | 'data' | 'email' | 'sms' | 'payment' | 'design'
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
export type ToolRole = 'super_admin' | 'company_admin' | 'member' | 'guest'

export const TOOL_SERVICE_IDS: readonly ToolServiceId[] = [
  'webonone',
  'data',
  'email',
  'sms',
  'payment',
  'design',
]

export function isToolServiceId(value: unknown): value is ToolServiceId {
  return typeof value === 'string' && (TOOL_SERVICE_IDS as readonly string[]).includes(value)
}

export const SERVICE_KEY_HEADERS: Record<ToolServiceId, string> = {
  webonone: 'X-WebOnOne-Service-Key',
  data: 'X-Data-Service-Key',
  email: 'X-Email-Service-Key',
  sms: 'X-Sms-Service-Key',
  payment: 'X-Payment-Service-Key',
  design: 'X-Design-Service-Key',
}

export type ArgCompletion = {
  allowedKeys?: string[]
  defaults?: Record<string, unknown>
  forceByRole?: Partial<Record<ToolRole, Record<string, unknown>>>
  uniqueBy?: string
  uniqueLookup?: { method: 'GET'; path: string; queryParam: 'names' }
  pascalCaseKeys?: string[]
}

export type RelatedArg = {
  argKey: string
  displayKey: string
  getPath: string
  listPath: string
  createTool: string
  cardinality?: 'one' | 'many'
  itemIdKey?: string
}

export type RelatedNode = {
  path: string
  displayKey: string
  exists: boolean
  selected: boolean
  record: Record<string, unknown>
  createTool?: string
  createArgs?: Record<string, unknown>
  recordId?: string
  children?: RelatedNode[]
}

export type ToolDefinition = {
  name: string
  description: string
  jsonSchema: Record<string, unknown>
  riskLevel: ToolRiskLevel
  requiredRoles: ToolRole[]
  requiredPermissions: string[]
  service: ToolServiceId
  auth: ToolAuth
  invoke: { method: HttpMethod; path: string }
  capabilityVersion: string
  argCompletion?: ArgCompletion
  relatedArgs?: RelatedArg[]
  /** Owning-frontend path template, e.g. `/services/{id}` or `/data/{kind}/{id}`. */
  viewPath?: string
}

export type ToolCall = {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export type ToolResult = {
  toolCallId: string
  name: string
  ok: boolean
  output: unknown
}

export class ToolRegistry {
  constructor(private tools: ToolDefinition[] = []) {}

  replace(tools: ToolDefinition[]): void {
    this.tools = [...tools]
  }

  list(): ToolDefinition[] {
    return [...this.tools]
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.find((tool) => tool.name === name)
  }
}

export interface ToolExecutor {
  execute(
    call: ToolCall,
    ctx: {
      role: ToolRole
      permissions: readonly string[]
      companyId: string | null
      accessToken: string | null
    },
    options?: {
      confirmed?: boolean
      relatedTree?: RelatedNode[]
      relatedSelections?: Record<string, boolean>
    },
  ): Promise<ToolResult>
  lookupExistingUniqueValues?(
    tool: ToolDefinition,
    ctx: {
      role: ToolRole
      permissions: readonly string[]
      companyId: string | null
      accessToken: string | null
    },
    values: string[],
  ): Promise<string[]>
  lookupRelatedRecord?(
    tool: ToolDefinition,
    spec: RelatedArg,
    ctx: {
      role: ToolRole
      permissions: readonly string[]
      companyId: string | null
      accessToken: string | null
    },
    query: { id?: string; name?: string },
  ): Promise<Record<string, unknown> | null>
}

export class NoopToolExecutor implements ToolExecutor {
  async execute(call: ToolCall): Promise<ToolResult> {
    return {
      toolCallId: call.id,
      name: call.name,
      ok: false,
      output: { code: 'TOOLS_NOT_ENABLED' },
    }
  }

  async lookupExistingUniqueValues(): Promise<string[]> {
    return []
  }

  async lookupRelatedRecord(): Promise<Record<string, unknown> | null> {
    return null
  }
}

export const toolRegistry = new ToolRegistry()
export const toolExecutor = new NoopToolExecutor()
