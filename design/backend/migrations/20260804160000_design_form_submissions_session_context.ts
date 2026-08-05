import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_form_submissions', (table) => {
    /** Cross-service ID copy of WebOnOne company_events.id (no FK). */
    table.string('event_id', 21).nullable()
    /** Session occurrence date (YYYY-MM-DD). */
    table.date('occurrence_date').nullable()
    /** Cross-service ID copy of WebOnOne company_event_session_tokens.id (no FK). */
    table.string('session_token_id', 21).nullable()

    table.index(['company_id', 'session_token_id'], 'dfs_company_session_token_idx')
    table.index(
      ['company_id', 'event_id', 'occurrence_date'],
      'dfs_company_event_occurrence_idx',
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_form_submissions', (table) => {
    table.dropIndex(['company_id', 'session_token_id'], 'dfs_company_session_token_idx')
    table.dropIndex(
      ['company_id', 'event_id', 'occurrence_date'],
      'dfs_company_event_occurrence_idx',
    )
    table.dropColumn('event_id')
    table.dropColumn('occurrence_date')
    table.dropColumn('session_token_id')
  })
}
