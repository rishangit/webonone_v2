import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_users', (table) => {
    table.string('id', 21).primary()
    table.string('email', 255).notNullable()
    table.string('display_name', 255).notNullable().defaultTo('')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['email'])
  })

  await knex.schema.createTable('design_companies', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_companies')
  await knex.schema.dropTableIfExists('design_users')
}
