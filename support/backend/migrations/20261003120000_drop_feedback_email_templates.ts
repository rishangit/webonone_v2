import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feedback_email_templates')
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('feedback_email_templates')
  if (hasTable) {
    return
  }

  await knex.schema.createTable('feedback_email_templates', (table) => {
    table.string('id', 21).primary()
    table.string('slug', 64).notNullable().unique()
    table.string('name', 200).notNullable()
    table.string('subject', 500).notNullable()
    table.text('body_html').notNullable()
    table.text('body_text').notNullable()
    table.timestamp('updated_at', { useTz: true }).notNullable()
  })
}
