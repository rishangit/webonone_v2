import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payment_subscriptions', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('plan_id', 21).notNullable()
    table.datetime('activated_at', { precision: 3 }).notNullable()
    table.enum('status', ['active', 'cancelled']).notNullable().defaultTo('active')
    table.datetime('cancelled_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('payment_companies').onDelete('CASCADE')
    table.foreign('plan_id').references('id').inTable('payment_plans')
    table.index(['status'])
    table.index(['company_id', 'status'])
  })

  await knex.schema.createTable('payment_invoices', (table) => {
    table.string('id', 21).primary()
    table.string('invoice_number', 32).notNullable().unique()
    table.string('company_id', 21).notNullable()
    table.string('subscription_id', 21).notNullable()
    table.enum('kind', ['system_subscription']).notNullable().defaultTo('system_subscription')
    table.enum('status', ['issued', 'paid', 'overdue', 'void']).notNullable().defaultTo('issued')
    table.string('currency', 3).notNullable().defaultTo('LKR')
    table.bigInteger('amount_minor').notNullable()
    table.datetime('period_start', { precision: 3 }).notNullable()
    table.datetime('period_end', { precision: 3 }).notNullable()
    table.datetime('issued_at', { precision: 3 }).notNullable()
    table.datetime('due_at', { precision: 3 }).notNullable()
    table.datetime('paid_at', { precision: 3 }).nullable()
    table.datetime('voided_at', { precision: 3 }).nullable()
    table.text('notes').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('payment_companies').onDelete('CASCADE')
    table.foreign('subscription_id').references('id').inTable('payment_subscriptions')
    table.unique(['company_id', 'kind', 'period_start'])
    table.index(['status'])
    table.index(['company_id', 'status'])
    table.index(['period_start'])
  })

  await knex.schema.createTable('payment_invoice_lines', (table) => {
    table.string('id', 21).primary()
    table.string('invoice_id', 21).notNullable()
    table.string('description', 512).notNullable()
    table.integer('quantity').notNullable().defaultTo(1)
    table.bigInteger('unit_amount_minor').notNullable()
    table.bigInteger('amount_minor').notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('invoice_id').references('id').inTable('payment_invoices').onDelete('CASCADE')
  })

  await knex.schema.createTable('payment_invoice_sequences', (table) => {
    table.integer('year').primary()
    table.integer('last_value').notNullable().defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_invoice_lines')
  await knex.schema.dropTableIfExists('payment_invoices')
  await knex.schema.dropTableIfExists('payment_subscriptions')
  await knex.schema.dropTableIfExists('payment_invoice_sequences')
}
