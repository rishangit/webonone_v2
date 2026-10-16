import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('company_catalog_discounts', 'variant_id')
  if (hasColumn) return
  await knex.schema.alterTable('company_catalog_discounts', (table) => {
    table.string('variant_id', 21).nullable()
    table.index(['company_id', 'entity_id', 'variant_id'], 'catalog_discounts_variant_idx')
  })
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('company_catalog_discounts', 'variant_id')
  if (!hasColumn) return
  await knex.schema.alterTable('company_catalog_discounts', (table) => {
    table.dropIndex(['company_id', 'entity_id', 'variant_id'], 'catalog_discounts_variant_idx')
    table.dropColumn('variant_id')
  })
}
