import type { Knex } from 'knex'

const STATUS_ENUM =
  "ENUM('todo', 'ready_to_develop', 'in_progress', 'developed', 'staging', 'closed') NOT NULL DEFAULT 'todo'"

export async function up(knex: Knex): Promise<void> {
  await knex('feedback_reports').where({ status: 'completed' }).update({ status: 'developed' })

  await knex.raw(`ALTER TABLE feedback_reports MODIFY COLUMN status ${STATUS_ENUM}`)
}

export async function down(knex: Knex): Promise<void> {
  await knex('feedback_reports').whereIn('status', ['staging', 'closed']).update({ status: 'developed' })
  await knex('feedback_reports').where({ status: 'developed' }).update({ status: 'completed' })

  await knex.raw(
    "ALTER TABLE feedback_reports MODIFY COLUMN status ENUM('todo', 'ready_to_develop', 'in_progress', 'completed') NOT NULL DEFAULT 'todo'",
  )
}
