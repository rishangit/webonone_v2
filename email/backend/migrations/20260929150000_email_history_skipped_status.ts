import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE email_history MODIFY COLUMN status ENUM('sent', 'failed', 'skipped') NOT NULL",
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex('email_history').where({ status: 'skipped' }).update({ status: 'failed' })
  await knex.raw("ALTER TABLE email_history MODIFY COLUMN status ENUM('sent', 'failed') NOT NULL")
}
