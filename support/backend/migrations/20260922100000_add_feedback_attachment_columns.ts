import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('feedback_reports', (table) => {
    table.string('upload_session_id', 21).nullable()
    table.string('attachment_media_id', 21).nullable()
    table.string('attachment_url', 2048).nullable()
    table.string('attachment_file_name', 255).nullable()
    table.string('attachment_mime_type', 127).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('feedback_reports', (table) => {
    table.dropColumn('upload_session_id')
    table.dropColumn('attachment_media_id')
    table.dropColumn('attachment_url')
    table.dropColumn('attachment_file_name')
    table.dropColumn('attachment_mime_type')
  })
}
