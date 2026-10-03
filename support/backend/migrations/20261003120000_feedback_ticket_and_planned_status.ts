import type { Knex } from 'knex'

const STATUS_ENUM =
  "ENUM('todo', 'ready_to_develop', 'planned', 'in_progress', 'developed', 'staging', 'closed') NOT NULL DEFAULT 'todo'"

function formatTicketNumber(sequence: number): string {
  return String(sequence).padStart(4, '0')
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('feedback_reports', (table) => {
    table.string('ticket_number', 4).nullable().unique()
  })

  const rows = await knex('feedback_reports').select('id').orderBy('created_at', 'asc')
  for (let i = 0; i < rows.length; i++) {
    await knex('feedback_reports')
      .where({ id: rows[i].id })
      .update({ ticket_number: formatTicketNumber(i + 1) })
  }

  await knex.schema.alterTable('feedback_reports', (table) => {
    table.string('ticket_number', 4).notNullable().alter()
  })

  await knex.raw(`ALTER TABLE feedback_reports MODIFY COLUMN status ${STATUS_ENUM}`)
}

export async function down(knex: Knex): Promise<void> {
  await knex('feedback_reports').where({ status: 'planned' }).update({ status: 'ready_to_develop' })

  await knex.raw(
    "ALTER TABLE feedback_reports MODIFY COLUMN status ENUM('todo', 'ready_to_develop', 'in_progress', 'developed', 'staging', 'closed') NOT NULL DEFAULT 'todo'",
  )

  await knex.schema.alterTable('feedback_reports', (table) => {
    table.dropColumn('ticket_number')
  })
}
