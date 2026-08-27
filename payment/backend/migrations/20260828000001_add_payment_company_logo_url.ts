import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payment_companies', (table) => {
    table.string('logo_url', 2048).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payment_companies', (table) => {
    table.dropColumn('logo_url')
  })
}
