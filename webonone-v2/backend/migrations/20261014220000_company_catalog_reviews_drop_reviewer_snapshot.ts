import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('company_catalog_reviews')
  if (!hasTable) return

  const hasName = await knex.schema.hasColumn('company_catalog_reviews', 'reviewer_display_name')
  const hasAvatar = await knex.schema.hasColumn('company_catalog_reviews', 'reviewer_avatar_url')
  if (!hasName && !hasAvatar) return

  await knex.schema.alterTable('company_catalog_reviews', (table) => {
    if (hasName) table.dropColumn('reviewer_display_name')
    if (hasAvatar) table.dropColumn('reviewer_avatar_url')
  })
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('company_catalog_reviews')
  if (!hasTable) return

  await knex.schema.alterTable('company_catalog_reviews', (table) => {
    table.string('reviewer_display_name', 255).nullable()
    table.string('reviewer_avatar_url', 2048).nullable()
  })
}
