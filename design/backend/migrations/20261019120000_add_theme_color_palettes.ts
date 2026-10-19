import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_themes', (table) => {
    table.json('color_palettes').nullable()
  })
  await knex('design_website_themes').update({ color_palettes: JSON.stringify([]) })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('design_website_themes', (table) => {
    table.dropColumn('color_palettes')
  })
}
