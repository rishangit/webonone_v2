import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.json('excluded_dates').nullable()
  })

  await knex('company_events').update({
    excluded_dates: JSON.stringify([]),
  })

  await knex.schema.alterTable('company_events', (table) => {
    table.json('excluded_dates').notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.dropColumn('excluded_dates')
  })
}
