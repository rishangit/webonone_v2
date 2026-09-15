import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feedback_reports', (table) => {
    table.string('id', 21).primary()
    table.enum('type', ['bug', 'feature']).notNullable()
    table.string('title', 200).notNullable()
    table.text('description').notNullable()
    table.enum('status', ['todo', 'in_progress', 'completed']).notNullable().defaultTo('todo')
    table.string('reporter_user_id', 21).notNullable()
    table.string('reporter_email', 255).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))

    table.index(['status'])
    table.index(['created_at'])
    table.index(['type'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feedback_reports')
}
