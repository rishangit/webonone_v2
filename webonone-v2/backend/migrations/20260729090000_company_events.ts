import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_events', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('service_id', 21).notNullable()
    table.string('service_name', 255).notNullable()
    table.enum('time_mode', ['duration', 'window']).notNullable()
    table.string('staff_id', 21).notNullable()
    table.string('staff_display_name', 255).notNullable()
    table.string('attendee_user_id', 21).nullable()
    table.string('attendee_display_name', 255).nullable()
    table.string('attendee_email', 255).nullable()
    table.date('starts_on').notNullable()
    table.time('start_time').notNullable()
    table.time('end_time').notNullable()
    table.enum('recurrence', ['none', 'weekly']).notNullable().defaultTo('none')
    table.date('recurrence_until').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.foreign('staff_id').references('id').inTable('company_staff').onDelete('CASCADE')
    table.index(['company_id'])
    table.index(['company_id', 'starts_on'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_events')
}
