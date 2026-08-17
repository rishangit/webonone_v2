export type ToolRiskLevel = 'read' | 'write' | 'destructive'
export type ToolAuth = 'user_jwt' | 'service_key'
export type ToolServiceId = 'webonone' | 'data' | 'email' | 'sms' | 'payment' | 'design'
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
export type ToolRole = 'super_admin' | 'company_admin' | 'member' | 'guest'

export type ArgCompletion = {
  allowedKeys?: string[]
  defaults?: Record<string, unknown>
  forceByRole?: Partial<Record<ToolRole, Record<string, unknown>>>
  uniqueBy?: string
  uniqueLookup?: { method: 'GET'; path: string; queryParam: 'names' }
  pascalCaseKeys?: string[]
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
  /** Owning-frontend path template, e.g. `/data/{kind}/{id}`. */
  viewPath?: string
}

export const AI_CAPABILITY_VERSION = '1'
