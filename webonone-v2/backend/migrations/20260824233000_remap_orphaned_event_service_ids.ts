import type { Knex } from 'knex'

/**
 * Older events can keep a service_id after the company catalog row was
 * unlinked/re-linked (new company_services.id). Workflow lives on the new id,
 * so session pages look empty. Remap orphans onto the current catalog row.
 */
export async function up(knex: Knex): Promise<void> {
  const events = await knex('company_events').select(
    'id',
    'company_id',
    'service_id',
    'service_name',
  )
  const services = await knex('company_services').select('id', 'company_id', 'library_entity_id')
  const catalogIds = new Set(services.map((row) => String(row.id)))
  const byLibrary = new Map(
    services
      .filter((row) => row.library_entity_id)
      .map((row) => [`${row.company_id}:${row.library_entity_id}`, String(row.id)]),
  )

  const remaps = new Map<string, string>()
  for (const event of events) {
    if (catalogIds.has(event.service_id)) continue

    const fromLibrary = byLibrary.get(`${event.company_id}:${event.service_id}`)
    if (fromLibrary) {
      remaps.set(event.id, fromLibrary)
      continue
    }

    const sameNameLive = events.filter(
      (other) =>
        other.company_id === event.company_id &&
        other.service_name === event.service_name &&
        catalogIds.has(other.service_id),
    )
    const uniqueLive = [...new Set(sameNameLive.map((row) => row.service_id))]
    if (uniqueLive.length === 1 && uniqueLive[0]) {
      remaps.set(event.id, uniqueLive[0])
      continue
    }

    const usedByOtherNames = new Set(
      events
        .filter(
          (other) =>
            other.company_id === event.company_id &&
            other.service_name !== event.service_name &&
            catalogIds.has(other.service_id),
        )
        .map((other) => other.service_id),
    )
    const unused = services
      .filter((row) => row.company_id === event.company_id && !usedByOtherNames.has(row.id))
      .map((row) => String(row.id))
    if (unused.length === 1 && unused[0]) {
      remaps.set(event.id, unused[0])
    }
  }

  for (const [eventId, serviceId] of remaps) {
    await knex('company_events').where({ id: eventId }).update({ service_id: serviceId })
  }

  await knex.raw(
    `UPDATE company_event_session_tokens AS token
     INNER JOIN company_events AS event
       ON event.id = token.event_id
      AND event.company_id = token.company_id
     INNER JOIN company_service_workflow_items AS first_step
       ON first_step.service_id = event.service_id
      AND first_step.company_id = token.company_id
      AND first_step.sort_order = (
        SELECT MIN(step.sort_order)
        FROM company_service_workflow_items AS step
        WHERE step.service_id = event.service_id
          AND step.company_id = token.company_id
      )
     SET token.current_workflow_item_id = first_step.id
     WHERE token.workflow_completed_at IS NULL
       AND token.status <> 'completed'
       AND token.current_workflow_item_id IS NULL`,
  )
}

export async function down(): Promise<void> {
  // Orphaned catalog ids cannot be restored reliably.
}
