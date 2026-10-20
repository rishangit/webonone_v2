import type { Knex } from 'knex'

const RENAMES = [
  ['design_website_color_library', 'design_website_library_color'],
  ['design_website_button_library', 'design_website_library_button'],
  ['design_website_font_library', 'design_website_library_font'],
] as const

export async function up(knex: Knex): Promise<void> {
  for (const [from, to] of RENAMES) {
    const hasFrom = await knex.schema.hasTable(from)
    const hasTo = await knex.schema.hasTable(to)
    if (hasFrom && !hasTo) await knex.schema.renameTable(from, to)
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const [from, to] of [...RENAMES].reverse()) {
    const hasFrom = await knex.schema.hasTable(from)
    const hasTo = await knex.schema.hasTable(to)
    if (hasTo && !hasFrom) await knex.schema.renameTable(to, from)
  }
}
