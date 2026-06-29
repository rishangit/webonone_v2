import { nanoid } from 'nanoid'
import { db } from '../models/db.js'

export async function logAudit(input: {
  userId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}) {
  await db('email_audit_log').insert({
    id: nanoid(),
    user_id: input.userId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata_json: input.metadata ? JSON.stringify(input.metadata) : null,
    created_at: db.fn.now(3),
  })
}
