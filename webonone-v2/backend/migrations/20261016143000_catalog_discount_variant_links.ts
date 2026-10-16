import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('company_catalog_discount_variants'))) {
    await knex.schema.createTable('company_catalog_discount_variants', (table) => {
      table.string('discount_id', 21).notNullable()
      table.string('variant_id', 21).notNullable()
      table.primary(['discount_id', 'variant_id'])
      table
        .foreign('discount_id')
        .references('id')
        .inTable('company_catalog_discounts')
        .onDelete('CASCADE')
    })
  }

  const hasVariantColumn = await knex.schema.hasColumn('company_catalog_discounts', 'variant_id')
  if (hasVariantColumn) {
    const rows = (await knex('company_catalog_discounts')
      .whereNotNull('variant_id')
      .select('id', 'variant_id')) as Array<{ id: string; variant_id: string }>
    const existing = new Set(
      (
        (await knex('company_catalog_discount_variants').select('discount_id', 'variant_id')) as Array<{
          discount_id: string
          variant_id: string
        }>
      ).map((row) => `${row.discount_id}:${row.variant_id}`),
    )
    const inserts = rows
      .filter((row) => !existing.has(`${row.id}:${row.variant_id}`))
      .map((row) => ({ discount_id: row.id, variant_id: row.variant_id }))
    if (inserts.length > 0) {
      await knex('company_catalog_discount_variants').insert(inserts)
    }
    await knex.schema.alterTable('company_catalog_discounts', (table) => {
      table.dropIndex(['company_id', 'entity_id', 'variant_id'], 'catalog_discounts_variant_idx')
      table.dropColumn('variant_id')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasVariantColumn = await knex.schema.hasColumn('company_catalog_discounts', 'variant_id')
  if (!hasVariantColumn) {
    await knex.schema.alterTable('company_catalog_discounts', (table) => {
      table.string('variant_id', 21).nullable()
    })
  }
  if (await knex.schema.hasTable('company_catalog_discount_variants')) {
    const rows = (await knex('company_catalog_discount_variants').select(
      'discount_id',
      'variant_id',
    )) as Array<{ discount_id: string; variant_id: string }>
    const firstByDiscount = new Map<string, string>()
    for (const row of rows) {
      if (!firstByDiscount.has(row.discount_id)) firstByDiscount.set(row.discount_id, row.variant_id)
    }
    for (const [discountId, variantId] of firstByDiscount) {
      await knex('company_catalog_discounts').where({ id: discountId }).update({ variant_id: variantId })
    }
    await knex.schema.dropTable('company_catalog_discount_variants')
  }
}
