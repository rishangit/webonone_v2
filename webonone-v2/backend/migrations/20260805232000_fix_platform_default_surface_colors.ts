import type { Knex } from 'knex'

const PLATFORM_DEFAULT_THEME_ID = 'V7xK9mN2pQw3rTy4uIoP0'

/** Brand accents + proper light/dark surfaces (color4 light, color5 dark). */
const PLATFORM_DEFAULT = {
  color1: '#344CE2',
  color2: '#3578E8',
  color3: '#3578E8',
  color4: '#EFF3FA',
  color5: '#0E2F59',
} as const

const PREVIOUS_PLATFORM_DEFAULT = {
  color1: '#344CE2',
  color2: '#3578E8',
  color3: '#3578E8',
  color4: '#6796E9',
  color5: '#6796E9',
} as const

export async function up(knex: Knex): Promise<void> {
  await knex('system_themes').where({ id: PLATFORM_DEFAULT_THEME_ID }).update({
    ...PLATFORM_DEFAULT,
    updated_at: knex.fn.now(3),
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex('system_themes').where({ id: PLATFORM_DEFAULT_THEME_ID }).update({
    ...PREVIOUS_PLATFORM_DEFAULT,
    updated_at: knex.fn.now(3),
  })
}
