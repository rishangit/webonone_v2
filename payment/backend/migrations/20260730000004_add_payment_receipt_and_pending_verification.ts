import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE payment_invoices
    MODIFY COLUMN status ENUM(
      'issued',
      'paid',
      'overdue',
      'void',
      'pending_verification'
    ) NOT NULL DEFAULT 'issued'
  `)

  await knex.schema.alterTable('payment_invoices', (table) => {
    table.string('receipt_media_id', 21).nullable()
    table.string('receipt_url', 2048).nullable()
    table.string('receipt_file_name', 255).nullable()
    table.datetime('receipt_uploaded_at', { precision: 3 }).nullable()
    table.string('receipt_uploaded_by', 21).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex('payment_invoices')
    .where({ status: 'pending_verification' })
    .update({ status: 'issued' })

  await knex.schema.alterTable('payment_invoices', (table) => {
    table.dropColumn('receipt_media_id')
    table.dropColumn('receipt_url')
    table.dropColumn('receipt_file_name')
    table.dropColumn('receipt_uploaded_at')
    table.dropColumn('receipt_uploaded_by')
  })

  await knex.raw(`
    ALTER TABLE payment_invoices
    MODIFY COLUMN status ENUM(
      'issued',
      'paid',
      'overdue',
      'void'
    ) NOT NULL DEFAULT 'issued'
  `)
}
