import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('data_user_roles', (table) => {
    table.string('user_id', 21).primary()
    table.string('role', 32).notNullable().defaultTo('member')
    table.string('company_id', 21).nullable()
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['role'])
    table.index(['company_id'])
  })

  await knex.schema.createTable('data_units', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.text('description').nullable()
    table.string('symbol', 32).notNullable()
    table.string('base_unit_id', 21).nullable()
    table.boolean('is_base').notNullable().defaultTo(false)
    table.enu('status', ['verified', 'pending']).notNullable().defaultTo('pending')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['status'])
    table.index(['is_base'])
  })

  await knex.schema.alterTable('data_units', (table) => {
    table.foreign('base_unit_id').references('id').inTable('data_units').onDelete('SET NULL')
  })

  await knex.schema.createTable('data_tags', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.text('description').nullable()
    table.string('color', 7).notNullable()
    table.enu('status', ['verified', 'pending']).notNullable().defaultTo('pending')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['status'])
  })

  await knex.schema.createTable('data_attributes', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.text('description').nullable()
    table.enu('value_type', ['number', 'text']).notNullable()
    table.string('unit_id', 21).nullable().references('id').inTable('data_units').onDelete('RESTRICT')
    table.enu('status', ['verified', 'pending']).notNullable().defaultTo('pending')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['status'])
    table.index(['value_type'])
  })

  const catalogTable = (name: string) => {
    return knex.schema.createTable(name, (table) => {
      table.string('id', 21).primary()
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.enu('status', ['verified', 'pending']).notNullable().defaultTo('pending')
      table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      table.index(['status'])
    })
  }

  await catalogTable('data_products')
  await catalogTable('data_services')
  await catalogTable('data_spaces')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_spaces')
  await knex.schema.dropTableIfExists('data_services')
  await knex.schema.dropTableIfExists('data_products')
  await knex.schema.dropTableIfExists('data_attributes')
  await knex.schema.dropTableIfExists('data_tags')
  await knex.schema.dropTableIfExists('data_units')
  await knex.schema.dropTableIfExists('data_user_roles')
}
