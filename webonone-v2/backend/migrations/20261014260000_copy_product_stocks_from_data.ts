import type { Knex } from 'knex'

async function schemaTableExists(knex: Knex, schema: string, table: string): Promise<boolean> {
  const [rows] = await knex.raw(
    `SELECT 1 AS ok
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?
     LIMIT 1`,
    [schema, table],
  )
  return Array.isArray(rows) && rows.length > 0
}

export async function up(knex: Knex): Promise<void> {
  const hasSource = await schemaTableExists(knex, 'webonone_data', 'data_stocks')
  const hasDest = await knex.schema.hasTable('company_product_stocks')
  if (!hasSource || !hasDest) return

  await knex.raw(`
    INSERT INTO company_product_stocks (
      id, company_id, company_product_id, library_product_id, library_variant_id,
      quantity, batch_number, cost_price, sell_price, purchase_date, expired_date,
      supplier_user_id, is_active, created_at, updated_at
    )
    SELECT
      s.id,
      cp.company_id,
      cp.id,
      v.product_id,
      s.variant_id,
      s.quantity,
      s.batch_number,
      s.cost_price,
      s.sell_price,
      s.purchase_date,
      s.expired_date,
      s.supplier_user_id,
      s.is_active,
      s.created_at,
      s.updated_at
    FROM webonone_data.data_stocks s
    INNER JOIN webonone_data.data_product_variants v ON v.id = s.variant_id
    INNER JOIN company_products cp
      ON cp.library_entity_id COLLATE utf8mb4_unicode_ci = v.product_id COLLATE utf8mb4_unicode_ci
    INNER JOIN companies c ON c.id = cp.company_id
    ON DUPLICATE KEY UPDATE
      quantity = VALUES(quantity),
      cost_price = VALUES(cost_price),
      sell_price = VALUES(sell_price),
      purchase_date = VALUES(purchase_date),
      expired_date = VALUES(expired_date),
      supplier_user_id = VALUES(supplier_user_id),
      is_active = VALUES(is_active),
      updated_at = VALUES(updated_at)
  `)

  const hasCounters = await schemaTableExists(knex, 'webonone_data', 'data_company_stock_counters')
  if (!hasCounters || !(await knex.schema.hasTable('company_stock_counters'))) return

  await knex.raw(`
    INSERT INTO company_stock_counters (company_id, next_seq)
    SELECT src.company_id, src.next_seq
    FROM webonone_data.data_company_stock_counters src
    INNER JOIN companies c ON c.id COLLATE utf8mb4_unicode_ci = src.company_id COLLATE utf8mb4_unicode_ci
    ON DUPLICATE KEY UPDATE next_seq = GREATEST(company_stock_counters.next_seq, VALUES(next_seq))
  `)
}

export async function down(): Promise<void> {
  // Copied company stocks stay in webonone_v2.
}
