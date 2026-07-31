import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('data_stocks', (table) => {
    table.string('id', 21).primary()
    table
      .string('variant_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_product_variants')
      .onDelete('CASCADE')
    table.decimal('quantity', 18, 6).notNullable()
    table.string('batch_number', 255).notNullable()
    table.decimal('cost_price', 18, 6).notNullable()
    table.decimal('sell_price', 18, 6).notNullable()
    table.date('purchase_date').notNullable()
    table.date('expired_date').nullable()
    table.string('supplier_user_id', 21).notNullable()
    table.string('supplier_display_name', 255).notNullable()
    table.string('supplier_email', 255).nullable()
    table.boolean('is_active').notNullable().defaultTo(false)
    table.timestamp('created_at', { useTz: false, precision: 3 }).notNullable()
    table.timestamp('updated_at', { useTz: false, precision: 3 }).notNullable()
    table.unique(['variant_id', 'batch_number'])
    table.index(['variant_id'])
    table.index(['variant_id', 'is_active'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_stocks')
}
