import type { Knex } from 'knex'

const STATUS_ENUM =
  "ENUM('todo', 'ready_to_develop', 'in_progress', 'completed') NOT NULL DEFAULT 'todo'"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE feedback_reports MODIFY COLUMN status ${STATUS_ENUM}`,
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex('feedback_reports')
    .where({ status: 'ready_to_develop' })
    .update({ status: 'todo' })

  await knex.raw(
    "ALTER TABLE feedback_reports MODIFY COLUMN status ENUM('todo', 'in_progress', 'completed') NOT NULL DEFAULT 'todo'",
  )
}
