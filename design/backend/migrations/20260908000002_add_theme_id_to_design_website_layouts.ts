import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_layouts', (table) => {
    table.string('theme_id', 21).nullable()
    table.index(['company_id', 'theme_id'], 'idx_design_website_layout_theme')
  })

  const companies = await knex('design_website_layouts').distinct('company_id')
  for (const row of companies) {
    const companyId = (row as { company_id: string }).company_id
    const defaultTheme =
      (await knex('design_website_themes')
        .where({ company_id: companyId, is_default: true, is_active: true })
        .select('id')
        .first()) ??
      (await knex('design_website_themes')
        .where({ company_id: companyId, is_active: true })
        .orderBy('updated_at', 'desc')
        .select('id')
        .first())
    if (!defaultTheme?.id) continue
    await knex('design_website_layouts').where({ company_id: companyId }).whereNull('theme_id').update({
      theme_id: defaultTheme.id,
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_layouts', (table) => {
    table.dropIndex(['company_id', 'theme_id'], 'idx_design_website_layout_theme')
    table.dropColumn('theme_id')
  })
}
