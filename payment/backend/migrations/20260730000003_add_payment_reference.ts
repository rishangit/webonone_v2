import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payment_invoices', (table) => {
    table.string('payment_reference', 32).nullable().after('invoice_number')
  })

  const rows = await knex('payment_invoices').select('id', 'invoice_number')
  for (const row of rows) {
    const invoiceNumber = String(row.invoice_number)
    const paymentReference = invoiceNumber.startsWith('SYS-')
      ? invoiceNumber.replace(/^SYS-/, 'WO-')
      : `WO-${invoiceNumber}`
    await knex('payment_invoices').where({ id: row.id }).update({ payment_reference: paymentReference })
  }

  await knex.schema.alterTable('payment_invoices', (table) => {
    table.string('payment_reference', 32).notNullable().alter()
    table.unique(['payment_reference'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payment_invoices', (table) => {
    table.dropUnique(['payment_reference'])
    table.dropColumn('payment_reference')
  })
}
