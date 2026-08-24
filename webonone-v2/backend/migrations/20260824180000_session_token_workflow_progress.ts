import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_tokens', (table) => {
    table.string('current_workflow_item_id', 21).nullable()
    table.datetime('workflow_completed_at', { precision: 3 }).nullable()
    table
      .foreign('current_workflow_item_id')
      .references('id')
      .inTable('company_service_workflow_items')
      .onDelete('SET NULL')
  })

  await knex('company_event_session_tokens')
    .where({ status: 'completed' })
    .whereNull('workflow_completed_at')
    .update({
      workflow_completed_at: knex.fn.now(3),
      current_workflow_item_id: null,
    })

  await knex.raw(
    `UPDATE company_event_session_tokens AS token
     INNER JOIN company_events AS event
       ON event.id = token.event_id
      AND event.company_id = token.company_id
     INNER JOIN company_service_workflow_items AS item
       ON item.service_id = event.service_id
      AND item.company_id = token.company_id
      AND item.kind = 'check_in'
     SET token.current_workflow_item_id = item.id
     WHERE token.status <> 'completed'
       AND token.current_workflow_item_id IS NULL
       AND token.workflow_completed_at IS NULL`,
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_tokens', (table) => {
    table.dropForeign(['current_workflow_item_id'])
    table.dropColumn('current_workflow_item_id')
    table.dropColumn('workflow_completed_at')
  })
}
