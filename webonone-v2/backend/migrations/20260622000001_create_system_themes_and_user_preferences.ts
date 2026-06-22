import type { Knex } from 'knex'

/** Fixed id for seeded Platform Default theme — keep in sync with themeService. */
export const PLATFORM_DEFAULT_THEME_ID = 'V7xK9mN2pQw3rTy4uIoP0'

const SYSTEM_CREATED_BY = '000000000000000000000'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('system_themes', (table) => {
    table.string('id', 21).primary()
    table.string('name', 100).notNullable()
    table.string('color1', 7).notNullable()
    table.string('color2', 7).notNullable()
    table.string('color3', 7).notNullable()
    table.string('color4', 7).notNullable()
    table.string('color5', 7).notNullable()
    table.string('created_by', 21).notNullable()
    table.boolean('is_system').notNullable().defaultTo(false)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['created_by'])
    table.index(['name'])
  })

  await knex('system_themes').insert({
    id: PLATFORM_DEFAULT_THEME_ID,
    name: 'Platform Default',
    color1: '#2563EB',
    color2: '#3B82F6',
    color3: '#F59E0B',
    color4: '#F8FAFC',
    color5: '#1E293B',
    created_by: SYSTEM_CREATED_BY,
    is_system: true,
    created_at: knex.fn.now(3),
    updated_at: knex.fn.now(3),
  })

  await knex.schema.createTable('user_preferences', (table) => {
    table.string('user_id', 21).primary()
    table.string('active_theme_id', 21).notNullable()
    table.enum('color_mode', ['light', 'dark']).notNullable().defaultTo('light')
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_preferences')
  await knex.schema.dropTableIfExists('system_themes')
}
