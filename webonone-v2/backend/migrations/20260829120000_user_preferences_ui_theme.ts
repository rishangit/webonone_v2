import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_preferences', (table) => {
    table.string('ui_theme', 32).notNullable().defaultTo('classic')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_preferences', (table) => {
    table.dropColumn('ui_theme')
  })
}
