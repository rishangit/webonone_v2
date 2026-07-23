import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_tags', (table) => {
    table.increments('id').primary()
    table.string('company_id', 21).notNullable()
    table.string('tag_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.string('color', 7).notNullable()
    table.integer('sort_order').unsigned().notNullable().defaultTo(0)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.unique(['company_id', 'tag_id'])
    table.index(['company_id', 'sort_order'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_tags')
}
