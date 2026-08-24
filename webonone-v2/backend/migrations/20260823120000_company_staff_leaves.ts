import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_staff_leaves', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('staff_id', 21).notNullable()
    table.string('leave_type', 32).notNullable()
    table.date('start_date').notNullable()
    table.date('end_date').notNullable()
    table.string('reason', 1000).nullable()
    table.string('status', 16).notNullable().defaultTo('pending')
    table.string('requested_by_user_id', 21).notNullable()
    table.string('decided_by_user_id', 21).nullable()
    table.datetime('decided_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.foreign('staff_id').references('id').inTable('company_staff').onDelete('CASCADE')
    table.index(['company_id', 'staff_id'])
    table.index(['staff_id', 'status'])
    table.index(['staff_id', 'start_date'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_staff_leaves')
}
