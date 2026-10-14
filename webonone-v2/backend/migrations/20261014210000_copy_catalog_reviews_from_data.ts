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
  const hasSource = await schemaTableExists(knex, 'webonone_data', 'data_catalog_reviews')
  const hasDest = await knex.schema.hasTable('company_catalog_reviews')
  if (!hasSource || !hasDest) return

  await knex.raw(`
    INSERT INTO company_catalog_reviews (
      id, company_id, entity_kind, entity_id, user_id, rating, comment,
      source_event_id, source_occurrence_date, created_at, updated_at
    )
    SELECT
      src.id, src.company_id, src.entity_kind, src.entity_id, src.user_id, src.rating, src.comment,
      src.source_event_id, src.source_occurrence_date, src.created_at, src.updated_at
    FROM webonone_data.data_catalog_reviews src
    INNER JOIN companies c ON c.id = src.company_id
    ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      comment = VALUES(comment),
      source_event_id = VALUES(source_event_id),
      source_occurrence_date = VALUES(source_occurrence_date),
      updated_at = VALUES(updated_at)
  `)
}

export async function down(): Promise<void> {
  // Copied company reviews stay in webonone_v2.
}
