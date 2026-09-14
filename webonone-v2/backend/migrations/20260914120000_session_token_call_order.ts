import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const hasCallOrder = await knex.schema.hasColumn(
    'company_event_session_tokens',
    'call_order',
  )
  if (!hasCallOrder) {
    await knex.schema.alterTable('company_event_session_tokens', (table) => {
      table.integer('call_order').unsigned().notNullable().defaultTo(0)
    })
  }

  await knex('company_event_session_tokens').update({
    call_order: knex.raw('token_number * 1000'),
  })

  const indexRows = await knex('information_schema.statistics')
    .where({
      table_schema: knex.raw('DATABASE()'),
      table_name: 'company_event_session_tokens',
      index_name: 'idx_session_tokens_call_order',
    })
    .first()

  if (!indexRows) {
    await knex.schema.alterTable('company_event_session_tokens', (table) => {
      table.index(
        ['company_id', 'event_id', 'occurrence_date', 'call_order'],
        'idx_session_tokens_call_order',
      )
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCallOrder = await knex.schema.hasColumn(
    'company_event_session_tokens',
    'call_order',
  )
  if (!hasCallOrder) return

  const indexRows = await knex('information_schema.statistics')
    .where({
      table_schema: knex.raw('DATABASE()'),
      table_name: 'company_event_session_tokens',
      index_name: 'idx_session_tokens_call_order',
    })
    .first()

  await knex.schema.alterTable('company_event_session_tokens', (table) => {
    if (indexRows) {
      table.dropIndex(
        ['company_id', 'event_id', 'occurrence_date', 'call_order'],
        'idx_session_tokens_call_order',
      )
    }
    table.dropColumn('call_order')
  })
}
