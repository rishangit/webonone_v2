import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feedback_comments', (table) => {
    table.string('id', 21).primary()
    table.string('feedback_report_id', 21).notNullable().index()
    table.string('author_user_id', 21).notNullable()
    table.string('author_email', 255).notNullable()
    table.text('body').notNullable()
    table.timestamp('created_at', { useTz: true }).notNullable()
    table
      .foreign('feedback_report_id')
      .references('id')
      .inTable('feedback_reports')
      .onDelete('CASCADE')
  })

  await knex.schema.createTable('feedback_report_views', (table) => {
    table.string('user_id', 21).notNullable()
    table.string('feedback_report_id', 21).notNullable()
    table.timestamp('last_viewed_at', { useTz: true }).notNullable()
    table.primary(['user_id', 'feedback_report_id'])
    table
      .foreign('feedback_report_id')
      .references('id')
      .inTable('feedback_reports')
      .onDelete('CASCADE')
  })

  await knex.schema.createTable('feedback_email_templates', (table) => {
    table.string('id', 21).primary()
    table.string('slug', 64).notNullable().unique()
    table.string('name', 200).notNullable()
    table.string('subject', 500).notNullable()
    table.text('body_html').notNullable()
    table.text('body_text').notNullable()
    table.timestamp('updated_at', { useTz: true }).notNullable()
  })

  const now = knex.fn.now(3)
  await knex('feedback_email_templates').insert({
    id: 'feedbackCommentTpl001',
    slug: 'feedback_comment',
    name: 'New feedback comment',
    subject: 'New comment on feedback: {{ticketTitle}}',
    body_html:
      '<p>{{commentAuthorEmail}} commented on <strong>{{ticketTitle}}</strong>:</p><p>{{commentBody}}</p><p><a href="{{feedbackUrl}}">View ticket</a></p>',
    body_text:
      '{{commentAuthorEmail}} commented on {{ticketTitle}}:\n\n{{commentBody}}\n\nView ticket: {{feedbackUrl}}',
    updated_at: now,
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feedback_email_templates')
  await knex.schema.dropTableIfExists('feedback_report_views')
  await knex.schema.dropTableIfExists('feedback_comments')
}
