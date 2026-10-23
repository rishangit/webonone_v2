import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE ai_messages MODIFY content MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL',
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE ai_messages MODIFY content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL',
  )
}
