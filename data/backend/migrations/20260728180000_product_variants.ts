import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('data_product_variants', (table) => {
    table.string('id', 21).primary()
    table
      .string('product_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_products')
      .onDelete('CASCADE')
    table.string('name', 255).notNullable()
    table.string('sku', 255).notNullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    table.timestamp('created_at', { useTz: false, precision: 3 }).notNullable()
    table.timestamp('updated_at', { useTz: false, precision: 3 }).notNullable()
    table.unique(['product_id', 'sku'])
    table.index(['product_id'])
  })

  await knex.schema.createTable('data_product_variant_values', (table) => {
    table
      .string('variant_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_product_variants')
      .onDelete('CASCADE')
    table
      .string('attribute_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_attributes')
      .onDelete('RESTRICT')
    table
      .string('attribute_value_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_product_attribute_values')
      .onDelete('RESTRICT')
    table.primary(['variant_id', 'attribute_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_product_variant_values')
  await knex.schema.dropTableIfExists('data_product_variants')
}
