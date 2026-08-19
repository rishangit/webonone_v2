import type { Knex } from 'knex'

const PRICED_TABLES = ['company_products', 'company_services', 'company_spaces'] as const

export async function up(knex: Knex): Promise<void> {
  for (const tableName of PRICED_TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.decimal('list_price', 18, 2).nullable()
    })
  }

  await knex.schema.createTable('company_sale_counters', (table) => {
    table.string('company_id', 21).primary()
    table.integer('next_seq').unsigned().notNullable().defaultTo(1)
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
  })

  await knex.schema.createTable('company_sales', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('bill_number', 32).notNullable()
    table.string('customer_user_id', 21).notNullable()
    table.string('customer_display_name', 255).notNullable()
    table.string('customer_email', 255).nullable()
    table.enum('status', ['completed', 'void']).notNullable().defaultTo('completed')
    table.enum('payment_method', ['cash', 'card', 'other']).notNullable()
    table.string('currency', 3).notNullable().defaultTo('LKR')
    table.decimal('subtotal', 18, 2).notNullable()
    table.decimal('total', 18, 2).notNullable()
    table.text('notes').nullable()
    table.string('created_by_user_id', 21).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.unique(['company_id', 'bill_number'])
    table.index(['company_id', 'created_at'])
    table.index(['company_id', 'customer_user_id'])
  })

  await knex.schema.createTable('company_sale_lines', (table) => {
    table.string('id', 21).primary()
    table.string('sale_id', 21).notNullable()
    table.string('company_id', 21).notNullable()
    table.integer('line_no').unsigned().notNullable()
    table.enum('item_kind', ['product', 'service', 'space']).notNullable()
    table.string('catalog_item_id', 21).notNullable()
    table.string('library_entity_id', 21).nullable()
    table.string('name_snapshot', 255).notNullable()
    table.string('variant_name_snapshot', 255).nullable()
    table.decimal('quantity', 12, 3).notNullable().defaultTo(1)
    table.decimal('unit_price', 18, 2).notNullable()
    table.decimal('line_total', 18, 2).notNullable()
    table.foreign('sale_id').references('id').inTable('company_sales').onDelete('CASCADE')
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.index(['company_id', 'item_kind'])
    table.unique(['sale_id', 'line_no'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_sale_lines')
  await knex.schema.dropTableIfExists('company_sales')
  await knex.schema.dropTableIfExists('company_sale_counters')

  for (const tableName of PRICED_TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('list_price')
    })
  }
}
