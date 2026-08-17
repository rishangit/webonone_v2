import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_provider_settings', (table) => {
    table.engine('InnoDB')
    table.charset('utf8mb4')
    table.collate('utf8mb4_unicode_ci')
    table.string('id', 21).primary()
    table.enum('scope', ['user', 'platform']).notNullable()
    table.string('user_id', 21).nullable()
    table.enum('provider', ['ollama', 'openai', 'gemini', 'anthropic']).notNullable().defaultTo('ollama')
    table.string('model', 128).notNullable()
    table.string('base_url', 512).notNullable()
    table.text('api_key_cipher').nullable()
    table.integer('timeout_ms').notNullable().defaultTo(180_000)
    table.text('extra_system_prompt').nullable()
    table.dateTime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.dateTime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['user_id'], 'uniq_ai_provider_settings_user')
    table.index(['scope'], 'idx_ai_provider_settings_scope')
  })

  await knex.raw(`
    ALTER TABLE ai_provider_settings
    ADD CONSTRAINT chk_ai_provider_settings_scope_user
    CHECK (
      (scope = 'user' AND user_id IS NOT NULL) OR
      (scope = 'platform' AND user_id IS NULL)
    )
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_provider_settings')
}
