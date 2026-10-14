import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_product_stocks', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('company_product_id', 21).notNullable()
    table.string('library_product_id', 21).notNullable()
    table.string('library_variant_id', 21).notNullable()
    table.decimal('quantity', 18, 6).notNullable()
    table.string('batch_number', 255).notNullable()
    table.decimal('cost_price', 18, 6).notNullable()
    table.decimal('sell_price', 18, 6).notNullable()
    table.date('purchase_date').notNullable()
    table.date('expired_date').nullable()
    table.string('supplier_user_id', 21).nullable()
    table.boolean('is_active').notNullable().defaultTo(false)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.foreign('company_product_id').references('id').inTable('company_products').onDelete('CASCADE')
    table.unique(['company_id', 'library_variant_id', 'batch_number'], {
      indexName: 'company_product_stocks_company_variant_batch_unique',
    })
    table.index(['company_id', 'company_product_id'], 'company_product_stocks_company_product_idx')
    table.index(
      ['company_product_id', 'library_variant_id', 'is_active'],
      'company_product_stocks_variant_active_idx',
    )
    table.index(['company_id', 'library_product_id'], 'company_product_stocks_library_product_idx')
  })

  await knex.schema.createTable('company_stock_counters', (table) => {
    table.string('company_id', 21).primary()
    table.integer('next_seq').unsigned().notNullable().defaultTo(1)
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_stock_counters')
  await knex.schema.dropTableIfExists('company_product_stocks')
}
