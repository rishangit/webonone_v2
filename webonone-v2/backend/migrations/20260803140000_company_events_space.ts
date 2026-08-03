import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.string('space_id', 21).nullable().after('attendee_email')
    table.string('space_name', 255).nullable().after('space_id')
    table.index(['company_id', 'space_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.dropIndex(['company_id', 'space_id'])
    table.dropColumn('space_name')
    table.dropColumn('space_id')
  })
}
