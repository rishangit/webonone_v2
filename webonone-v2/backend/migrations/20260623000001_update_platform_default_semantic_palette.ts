import type { Knex } from 'knex'

const PLATFORM_DEFAULT_THEME_ID = 'V7xK9mN2pQw3rTy4uIoP0'

const SEMANTIC_PLATFORM_DEFAULT = {
  color1: '#2563EB',
  color2: '#3B82F6',
  color3: '#F59E0B',
  color4: '#F8FAFC',
  color5: '#1E293B',
} as const

export async function up(knex: Knex): Promise<void> {
  await knex('system_themes').where({ id: PLATFORM_DEFAULT_THEME_ID }).update({
    ...SEMANTIC_PLATFORM_DEFAULT,
    updated_at: knex.fn.now(3),
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex('system_themes').where({ id: PLATFORM_DEFAULT_THEME_ID }).update({
    color1: '#61D3CE',
    color2: '#2F7E69',
    color3: '#93248E',
    color4: '#F5454E',
    color5: '#EA6BFB',
    updated_at: knex.fn.now(3),
  })
}
