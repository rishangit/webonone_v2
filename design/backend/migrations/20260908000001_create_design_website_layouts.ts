import { nanoid } from 'nanoid'
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('design_website_layouts', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('name', 255).notNullable()
    table.string('header_id', 21).nullable()
    table.string('footer_id', 21).nullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    table.string('created_by', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id', 'is_default'], 'idx_design_website_layout_default')
    table.index(['company_id', 'header_id'], 'idx_design_website_layout_header')
    table.index(['company_id', 'footer_id'], 'idx_design_website_layout_footer')
  })

  await knex.schema.alterTable('design_website_pages', (table) => {
    table.string('layout_id', 21).nullable()
    table.integer('sort_order').notNullable().defaultTo(0)
    table.index(['company_id', 'layout_id', 'sort_order'], 'idx_design_website_page_layout')
  })

  const companyIds = new Set<string>()
  const pageCompanies = await knex('design_website_pages').distinct<{ company_id: string }[]>('company_id')
  const headerCompanies = await knex('design_website_headers').distinct<{ company_id: string }[]>('company_id')
  const footerCompanies = await knex('design_website_footers').distinct<{ company_id: string }[]>('company_id')
  for (const row of [...pageCompanies, ...headerCompanies, ...footerCompanies]) {
    if (row.company_id) companyIds.add(row.company_id)
  }

  for (const companyId of companyIds) {
    const [defaultHeader] = await knex('design_website_headers')
      .where({ company_id: companyId, is_default: true })
      .select('id')
    const [defaultFooter] = await knex('design_website_footers')
      .where({ company_id: companyId, is_default: true })
      .select('id')
    const layoutId = nanoid()
    await knex('design_website_layouts').insert({
      id: layoutId,
      company_id: companyId,
      name: 'Main',
      header_id: defaultHeader?.id ?? null,
      footer_id: defaultFooter?.id ?? null,
      is_default: true,
      created_by: null,
      created_at: knex.fn.now(3),
      updated_at: knex.fn.now(3),
    })
    const pages = await knex('design_website_pages')
      .where({ company_id: companyId })
      .orderBy('created_at', 'asc')
      .select('id')
    for (const [index, page] of pages.entries()) {
      await knex('design_website_pages').where({ id: page.id }).update({
        layout_id: layoutId,
        sort_order: index,
      })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_pages', (table) => {
    table.dropIndex(['company_id', 'layout_id', 'sort_order'], 'idx_design_website_page_layout')
    table.dropColumn('layout_id')
    table.dropColumn('sort_order')
  })
  await knex.schema.dropTableIfExists('design_website_layouts')
}
