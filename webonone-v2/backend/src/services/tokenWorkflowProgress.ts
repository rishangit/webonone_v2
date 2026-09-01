import { listLibraryItemsByIds } from '../clients/dataCatalogClient.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import type { CompanyEventSessionTokenRow } from '../repositories/companyEventSessionToken.repository.js'

export const DONE_STEP_ID = '__done__'

export type TokenWorkflowStepKind = 'check_in' | 'space' | 'done'

export type TokenWorkflowStepDto = {
  id: string
  label: string
  kind: TokenWorkflowStepKind
}

export type TokenWorkflowProgressDto = {
  steps: TokenWorkflowStepDto[]
  currentIndex: number
  done: boolean
}

export type WorkflowStepDef = {
  id: string
  kind: 'check_in' | 'space'
  label: string
}

function localSpaceName(row: Record<string, unknown> | undefined): string | null {
  if (!row) return null
  if (typeof row.name === 'string' && row.name.trim()) return row.name.trim()
  const payload = row.payload
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const name = (payload as { name?: unknown }).name
    if (typeof name === 'string' && name.trim()) return name.trim()
  }
  return null
}

export async function resolveSpaceNamesById(
  companyId: string,
  spaceIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(spaceIds.filter(Boolean))]
  const names = new Map<string, string>()
  if (unique.length === 0) return names

  const spaces = await catalogRepo.findByIds(companyId, 'spaces', unique)
  const libraryIds: string[] = []
  for (const row of spaces) {
    const id = String(row.id)
    const local = localSpaceName(row)
    if (local) {
      names.set(id, local)
      continue
    }
    if (row.binding_mode === 'linked' && typeof row.library_entity_id === 'string') {
      libraryIds.push(row.library_entity_id)
    }
  }

  const libraryItems = await listLibraryItemsByIds('spaces', libraryIds)
  const libraryNameById = new Map(libraryItems.map((item) => [item.id, item.name]))
  for (const row of spaces) {
    const id = String(row.id)
    if (names.has(id)) continue
    if (typeof row.library_entity_id === 'string') {
      const libraryName = libraryNameById.get(row.library_entity_id)?.trim()
      if (libraryName) names.set(id, libraryName)
    }
  }
  return names
}

export async function loadWorkflowStepDefs(
  companyId: string,
  serviceId: string,
): Promise<WorkflowStepDef[]> {
  const service =
    (await catalogRepo.findById(companyId, 'services', serviceId)) ??
    (await catalogRepo.findByLibraryId(companyId, 'services', serviceId))
  const catalogServiceId = service ? String(service.id) : serviceId
  const items = await catalogRepo.listWorkflowItems(companyId, catalogServiceId)
  const spaceIds = items
    .map((item) => item.space_id)
    .filter((id): id is string => Boolean(id))
  const spaceNameById = await resolveSpaceNamesById(companyId, spaceIds)
  return items.map((item, index) => {
    const spaceName = item.space_id ? spaceNameById.get(item.space_id) : undefined
    if (item.kind === 'check_in') {
      return {
        id: item.id,
        kind: 'check_in' as const,
        label: spaceName ? `Check-in · ${spaceName}` : 'Check-in',
      }
    }
    return {
      id: item.id,
      kind: 'space' as const,
      label: spaceName ?? `Step ${index + 1}`,
    }
  })
}

export function firstWorkflowItemId(defs: WorkflowStepDef[]): string | null {
  return defs[0]?.id ?? null
}

function firstSpaceWorkflowItemId(defs: WorkflowStepDef[]): string | null {
  return defs.find((def) => def.kind === 'space')?.id ?? null
}

function checkInWorkflowItemId(defs: WorkflowStepDef[]): string | null {
  return defs.find((def) => def.kind === 'check_in')?.id ?? firstWorkflowItemId(defs)
}

/** Resolve the workflow step a token is on, including null/invalid stored pointers. */
export function resolveEffectiveWorkflowItemId(
  defs: WorkflowStepDef[],
  token: Pick<
    CompanyEventSessionTokenRow,
    'current_workflow_item_id' | 'workflow_completed_at' | 'status'
  >,
  options?: { checkedIn?: boolean; sessionStarted?: boolean },
): string | null {
  if (token.workflow_completed_at || token.status === 'completed') return null
  const stored = token.current_workflow_item_id
  if (stored && defs.some((def) => def.id === stored)) return stored
  if (!options?.checkedIn) return checkInWorkflowItemId(defs)
  if (!options?.sessionStarted) return checkInWorkflowItemId(defs)
  return firstSpaceWorkflowItemId(defs) ?? checkInWorkflowItemId(defs)
}

function resolveWorkflowStepIndex(
  defs: WorkflowStepDef[],
  token: Pick<
    CompanyEventSessionTokenRow,
    'current_workflow_item_id' | 'workflow_completed_at' | 'status'
  >,
  options?: { checkedIn?: boolean; sessionStarted?: boolean },
): number {
  const effectiveId = resolveEffectiveWorkflowItemId(defs, token, options)
  if (!effectiveId) return -1
  const idx = defs.findIndex((def) => def.id === effectiveId)
  return idx >= 0 ? idx : -1
}

export function buildWorkflowProgress(
  defs: WorkflowStepDef[],
  token: Pick<
    CompanyEventSessionTokenRow,
    'current_workflow_item_id' | 'workflow_completed_at' | 'status'
  >,
  options?: { checkedIn?: boolean; sessionStarted?: boolean },
): TokenWorkflowProgressDto {
  const steps: TokenWorkflowStepDto[] = [
    ...defs.map((def) => ({ id: def.id, label: def.label, kind: def.kind })),
    { id: DONE_STEP_ID, label: 'Done', kind: 'done' },
  ]
  const done =
    Boolean(token.workflow_completed_at) || token.status === 'completed'
  if (done) {
    return { steps, currentIndex: steps.length - 1, done: true }
  }
  const checkInIndex = defs.findIndex((def) => def.kind === 'check_in')
  if (checkInIndex >= 0 && !options?.checkedIn) {
    return { steps, currentIndex: -1, done: false }
  }
  if (checkInIndex >= 0 && !options?.sessionStarted) {
    return { steps, currentIndex: checkInIndex, done: false }
  }
  const idx = resolveWorkflowStepIndex(defs, token, options)
  if (idx >= 0) {
    return { steps, currentIndex: idx, done: false }
  }
  return { steps, currentIndex: checkInIndex >= 0 ? checkInIndex : 0, done: false }
}

export function nextWorkflowState(
  defs: WorkflowStepDef[],
  currentItemId: string | null,
): { current_workflow_item_id: string | null; workflow_completed_at: Date | null } {
  if (defs.length === 0) {
    return { current_workflow_item_id: null, workflow_completed_at: new Date() }
  }
  const idx = currentItemId ? defs.findIndex((def) => def.id === currentItemId) : -1
  const resolvedIdx =
    idx >= 0
      ? idx
      : currentItemId
        ? Math.max(0, defs.findIndex((def) => def.kind === 'space'))
        : -1
  const next = resolvedIdx < 0 ? defs[0] : defs[resolvedIdx + 1]
  if (!next) {
    return { current_workflow_item_id: null, workflow_completed_at: new Date() }
  }
  return { current_workflow_item_id: next.id, workflow_completed_at: null }
}
