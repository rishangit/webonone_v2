import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_staff', (table) => {
    table.string('avatar_url', 2048).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_staff', (table) => {
    table.dropColumn('avatar_url')
  })
}
