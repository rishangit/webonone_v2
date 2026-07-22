import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.decimal('latitude', 10, 7).nullable()
    table.decimal('longitude', 10, 7).nullable()
    table.string('map_place_id', 255).nullable()
    table.string('map_formatted_address', 512).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.dropColumn('latitude')
    table.dropColumn('longitude')
    table.dropColumn('map_place_id')
    table.dropColumn('map_formatted_address')
  })
}
