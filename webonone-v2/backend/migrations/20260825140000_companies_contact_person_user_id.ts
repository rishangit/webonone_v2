import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.string('contact_person_user_id', 21).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.dropColumn('contact_person_user_id')
  })
}
