import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('data_stocks')
  if (!hasTable) return

  const hasName = await knex.schema.hasColumn('data_stocks', 'supplier_display_name')
  const hasEmail = await knex.schema.hasColumn('data_stocks', 'supplier_email')
  if (!hasName && !hasEmail) return

  await knex.schema.alterTable('data_stocks', (table) => {
    if (hasName) table.dropColumn('supplier_display_name')
    if (hasEmail) table.dropColumn('supplier_email')
  })
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('data_stocks')
  if (!hasTable) return

  const hasName = await knex.schema.hasColumn('data_stocks', 'supplier_display_name')
  const hasEmail = await knex.schema.hasColumn('data_stocks', 'supplier_email')

  await knex.schema.alterTable('data_stocks', (table) => {
    if (!hasName) table.string('supplier_display_name', 255).nullable()
    if (!hasEmail) table.string('supplier_email', 255).nullable()
  })
}
