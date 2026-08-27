import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_stocks', (table) => {
    table.string('supplier_user_id', 21).nullable().alter()
    table.string('supplier_display_name', 255).nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_stocks', (table) => {
    table.string('supplier_user_id', 21).notNullable().alter()
    table.string('supplier_display_name', 255).notNullable().alter()
  })
}
