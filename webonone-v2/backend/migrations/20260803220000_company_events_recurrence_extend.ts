import type { Knex } from 'knex'

const RECURRENCE_ENUM =
  "ENUM('none', 'weekly', 'biweekly', 'monthly_first_week', 'monthly_by_date')"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE company_events MODIFY COLUMN recurrence ${RECURRENCE_ENUM} NOT NULL DEFAULT 'none'`,
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex('company_events')
    .whereIn('recurrence', ['biweekly', 'monthly_first_week', 'monthly_by_date'])
    .update({ recurrence: 'weekly' })

  await knex.raw(
    "ALTER TABLE company_events MODIFY COLUMN recurrence ENUM('none', 'weekly') NOT NULL DEFAULT 'none'",
  )
}
