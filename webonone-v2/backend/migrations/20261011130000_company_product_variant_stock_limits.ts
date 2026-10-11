import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_product_variant_stock_limits', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('company_product_id', 21).notNullable()
    table.string('library_variant_id', 21).notNullable()
    table.decimal('min_quantity', 12, 3).nullable()
    table.decimal('max_quantity', 12, 3).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table
      .foreign('company_product_id')
      .references('id')
      .inTable('company_products')
      .onDelete('CASCADE')
    table.unique(['company_product_id', 'library_variant_id'], {
      indexName: 'company_product_variant_stock_limits_product_variant_unique',
    })
    table.index(['company_id', 'company_product_id'], 'company_product_variant_stock_limits_company_product_idx')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_product_variant_stock_limits')
}
