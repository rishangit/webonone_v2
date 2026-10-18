import type { Knex } from 'knex'
import { COLOR_LIBRARY_PALETTES } from '../src/catalog/websiteLibrary.js'

export async function up(knex: Knex): Promise<void> {
  const hasValue = await knex.schema.hasColumn('design_website_color_library', 'value')
  const hasPalette = await knex.schema.hasColumn('design_website_color_library', 'palette')

  if (!hasPalette) {
    await knex.schema.alterTable('design_website_color_library', (table) => {
      table.json('palette').nullable()
    })
  }

  if (hasValue) {
    await knex('design_website_color_library').del()
    await knex.schema.alterTable('design_website_color_library', (table) => {
      table.dropUnique(['value'], 'uq_design_website_color_library_value')
      table.dropColumn('value')
    })
  }

  const activeCount = await knex('design_website_color_library').where({ is_active: true }).count('* as count').first()
  if (Number(activeCount?.count ?? 0) === 0) {
    await knex('design_website_color_library').insert(
      COLOR_LIBRARY_PALETTES.map((item) => ({
        id: item.id,
        name: item.name,
        palette: JSON.stringify(item.palette),
        sort_order: item.sortOrder,
        is_active: true,
      })),
    )
  }

  await knex.schema.alterTable('design_website_color_library', (table) => {
    table.json('palette').notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  const hasValue = await knex.schema.hasColumn('design_website_color_library', 'value')
  if (!hasValue) {
    await knex.schema.alterTable('design_website_color_library', (table) => {
      table.string('value', 32).nullable()
    })
  }
  await knex('design_website_color_library').update({ is_active: false })
  await knex.schema.alterTable('design_website_color_library', (table) => {
    table.dropUnique(['name'], 'uq_design_website_color_library_name')
    table.dropColumn('palette')
  })
}
