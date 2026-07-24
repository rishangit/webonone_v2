import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_services', (table) => {
    table.enu('time_mode', ['duration', 'window']).notNullable().defaultTo('duration')
    table.integer('duration_minutes').unsigned().nullable()
    table.time('start_time').nullable()
    table.time('end_time').nullable()
  })

  await knex('data_services').update({
    time_mode: 'duration',
    duration_minutes: 60,
    start_time: null,
    end_time: null,
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_services', (table) => {
    table.dropColumn('time_mode')
    table.dropColumn('duration_minutes')
    table.dropColumn('start_time')
    table.dropColumn('end_time')
  })
}
