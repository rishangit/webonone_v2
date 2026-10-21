import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE companies MODIFY COLUMN status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft'",
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex('companies').where({ status: 'draft' }).update({ status: 'pending' })
  await knex.raw(
    "ALTER TABLE companies MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'",
  )
}
