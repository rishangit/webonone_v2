import type { Knex } from 'knex'

async function schemaTableExists(
  knex: Knex,
  schema: string,
  table: string,
): Promise<boolean> {
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
  const hasSource = await knex.schema.hasTable('data_stocks')
  if (hasSource) {
    const countRow = await knex('data_stocks').count({ c: '*' }).first()
    const count = Number(countRow?.c ?? 0)
    const hasDest = await schemaTableExists(knex, 'webonone_v2', 'company_product_stocks')

    if (count > 0 && !hasDest) {
      throw new Error(
        'Run webonone-v2 migrations first (company_product_stocks) before dropping data_stocks',
      )
    }
  }

  await knex.schema.dropTableIfExists('data_stocks')
  await knex.schema.dropTableIfExists('data_company_stock_counters')
}

export async function down(): Promise<void> {
  // Stocks now live in webonone_v2.company_product_stocks.
}
