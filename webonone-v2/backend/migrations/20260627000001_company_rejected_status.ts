import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE companies MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'",
  )

  await knex.schema.alterTable('super_admins', (table) => {
    table.string('password_hash', 255).nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE companies MODIFY COLUMN status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending'",
  )

  await knex.schema.alterTable('super_admins', (table) => {
    table.string('password_hash', 255).notNullable().alter()
  })
}
