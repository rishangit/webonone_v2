import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_sales', (table) => {
    table.string('session_token_id', 21).nullable()
    table.index(['company_id', 'session_token_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_sales', (table) => {
    table.dropIndex(['company_id', 'session_token_id'])
    table.dropColumn('session_token_id')
  })
}
