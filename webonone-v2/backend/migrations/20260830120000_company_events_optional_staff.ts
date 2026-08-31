import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.dropForeign(['staff_id'])
  })
  await knex.schema.alterTable('company_events', (table) => {
    table.string('staff_id', 21).nullable().alter()
    table.string('staff_display_name', 255).nullable().alter()
    table
      .foreign('staff_id')
      .references('id')
      .inTable('company_staff')
      .onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.dropForeign(['staff_id'])
  })
  await knex.schema.alterTable('company_events', (table) => {
    table.string('staff_id', 21).notNullable().alter()
    table.string('staff_display_name', 255).notNullable().alter()
    table
      .foreign('staff_id')
      .references('id')
      .inTable('company_staff')
      .onDelete('CASCADE')
  })
}
