import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_service_spaces', (table) => {
    table.string('company_id', 21).notNullable()
    table.string('service_id', 21).notNullable()
    table.string('space_id', 21).notNullable()
    table.integer('sort_order').unsigned().notNullable()
    table.primary(['service_id', 'space_id'])
    table.index(['company_id', 'service_id', 'sort_order'])
    table
      .foreign('company_id')
      .references('id')
      .inTable('companies')
      .onDelete('CASCADE')
    table
      .foreign('service_id')
      .references('id')
      .inTable('company_services')
      .onDelete('CASCADE')
    table
      .foreign('space_id')
      .references('id')
      .inTable('company_spaces')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_service_spaces')
}
