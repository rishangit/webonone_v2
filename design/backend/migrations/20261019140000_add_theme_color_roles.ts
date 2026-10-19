import type { Knex } from 'knex'

const TABLES = ['design_website_themes', 'design_website_library_themes'] as const

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.json('color_roles').nullable()
    })
    await knex(tableName).update({ color_roles: JSON.stringify({}) })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('color_roles')
    })
  }
}
