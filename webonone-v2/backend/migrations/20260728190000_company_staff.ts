import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_staff', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('user_id', 21).notNullable()
    table.string('display_name', 255).notNullable()
    table.string('email', 255).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.unique(['company_id', 'user_id'])
    table.index(['company_id'])
  })

  await knex.schema.createTable('company_staff_schedules', (table) => {
    table.string('id', 21).primary()
    table.string('staff_id', 21).notNullable()
    table.tinyint('day_of_week').unsigned().notNullable()
    table.boolean('is_working').notNullable().defaultTo(false)
    table.time('start_time').nullable()
    table.time('end_time').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('staff_id').references('id').inTable('company_staff').onDelete('CASCADE')
    table.unique(['staff_id', 'day_of_week'])
    table.index(['staff_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_staff_schedules')
  await knex.schema.dropTableIfExists('company_staff')
}
