import type { AiRole } from '../models/db.js'

export const AI_PERMISSIONS = [
  'ai:chat',
  'ai:public_catalog:read',
  'ai:catalog:read',
  'ai:catalog:write',
  'ai:events:read',
  'ai:events:write',
  'ai:staff:read',
  'ai:staff:write',
  'ai:company:read',
  'ai:company:write',
  'ai:company:admin',
  'ai:data_library:read',
  'ai:data_library:write',
  'ai:data_library:admin',
  'ai:data_catalog:write',
] as const

export type AiPermission = (typeof AI_PERMISSIONS)[number]

export type ConversationOwner = {
  userId: string | null
  companyId: string | null
  guestId: string | null
}

export type AiRequestContext = {
  userId: string | null
  companyId: string | null
  guestId: string | null
  role: AiRole
  permissions: readonly AiPermission[]
  conversationId: string | null
  accessToken: string | null
}

export function permissionsForRole(role: AiRole, companyId: string | null): AiPermission[] {
  const guest: AiPermission[] = ['ai:chat', 'ai:public_catalog:read']
  if (role === 'guest') {
    return guest
  }

  if (role === 'super_admin') {
    return [
      ...guest,
      'ai:data_library:read',
      'ai:data_library:write',
      'ai:data_library:admin',
      'ai:data_catalog:write',
      'ai:company:admin',
    ]
  }

  const withLibraryRead: AiPermission[] = [...guest, 'ai:data_library:read']
  const companyReads: AiPermission[] = companyId
    ? [...withLibraryRead, 'ai:catalog:read', 'ai:events:read', 'ai:staff:read', 'ai:company:read']
    : withLibraryRead

  if (role === 'member') {
    return companyReads
  }

  const companyAdmin: AiPermission[] = [
    ...companyReads,
    'ai:data_library:write',
    'ai:data_catalog:write',
  ]
  if (companyId) {
    companyAdmin.push('ai:catalog:write', 'ai:events:write', 'ai:staff:write', 'ai:company:write')
  }
  return companyAdmin
}

export function buildAiRequestContext(input: {
  userId: string | null
  companyId: string | null
  guestId: string | null
  role: AiRole
  conversationId?: string | null
  accessToken?: string | null
}): AiRequestContext {
  return {
    userId: input.userId,
    companyId: input.companyId,
    guestId: input.guestId,
    role: input.role,
    permissions: permissionsForRole(input.role, input.companyId),
    conversationId: input.conversationId ?? null,
    accessToken: input.accessToken ?? null,
  }
}

export function ownerFromContext(ctx: AiRequestContext): ConversationOwner {
  return {
    userId: ctx.userId,
    companyId: ctx.companyId,
    guestId: ctx.guestId,
  }
}
