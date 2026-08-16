import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_conversations', (table) => {
    table.engine('InnoDB')
    table.charset('utf8mb4')
    table.collate('utf8mb4_unicode_ci')
    table.string('id', 21).primary()
    table.string('company_id', 21).nullable()
    table.string('user_id', 21).nullable()
    table.string('guest_id', 21).nullable()
    table.string('title', 255).nullable()
    table.dateTime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.dateTime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id', 'company_id', 'updated_at'], 'idx_ai_conversations_user_company')
    table.index(['guest_id', 'updated_at'], 'idx_ai_conversations_guest')
  })

  await knex.raw(`
    ALTER TABLE ai_conversations
    ADD CONSTRAINT chk_ai_conversations_principal
    CHECK (
      (user_id IS NOT NULL AND guest_id IS NULL) OR
      (user_id IS NULL AND guest_id IS NOT NULL)
    )
  `)

  await knex.schema.createTable('ai_messages', (table) => {
    table.engine('InnoDB')
    table.charset('utf8mb4')
    table.collate('utf8mb4_unicode_ci')
    table.string('id', 21).primary()
    table.string('conversation_id', 21).notNullable()
    table.string('company_id', 21).nullable()
    table.string('role', 32).notNullable()
    table.text('content').notNullable()
    table.string('tool_name', 128).nullable()
    table.string('tool_call_id', 64).nullable()
    table.json('tool_payload').nullable()
    table.dateTime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table
      .foreign('conversation_id', 'fk_ai_messages_conversation')
      .references('id')
      .inTable('ai_conversations')
      .onDelete('CASCADE')
    table.index(['conversation_id', 'created_at'], 'idx_ai_messages_conversation')
    table.index(['company_id'], 'idx_ai_messages_company')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_messages')
  await knex.schema.dropTableIfExists('ai_conversations')
}
