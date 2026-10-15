import type { Knex } from 'knex'

const APPLY_WHEN = ['all_time', 'selected_days'] as const
const APPLY_TO = ['everyone', 'selected_users'] as const
const KINDS = ['services', 'spaces'] as const

export async function up(knex: Knex): Promise<void> {
  // A failed first attempt can leave the table without recording the migration.
  await knex.schema.dropTableIfExists('company_catalog_price_rule_users')
  await knex.schema.dropTableIfExists('company_catalog_price_rules')

  await knex.schema.createTable('company_catalog_price_rules', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.enum('entity_kind', [...KINDS]).notNullable()
    table.string('entity_id', 21).notNullable()
    table.decimal('price', 18, 2).notNullable()
    table.enum('apply_when', [...APPLY_WHEN]).notNullable()
    table.json('weekdays').nullable()
    table.time('start_time').nullable()
    table.time('end_time').nullable()
    table.enum('apply_to', [...APPLY_TO]).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.index(['company_id', 'entity_kind', 'entity_id'], 'catalog_price_rules_entity_idx')
  })

  await knex.schema.createTable('company_catalog_price_rule_users', (table) => {
    table.string('rule_id', 21).notNullable()
    table.string('user_id', 21).notNullable()
    table.primary(['rule_id', 'user_id'])
    table
      .foreign('rule_id')
      .references('id')
      .inTable('company_catalog_price_rules')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_catalog_price_rule_users')
  await knex.schema.dropTableIfExists('company_catalog_price_rules')
}
