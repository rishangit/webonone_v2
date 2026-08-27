import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE `company_sales` MODIFY COLUMN `status` ENUM('draft', 'completed', 'void') NOT NULL DEFAULT 'completed'",
  )
  await knex.raw(
    "ALTER TABLE `company_sales` MODIFY COLUMN `payment_method` ENUM('cash', 'card', 'other') NULL",
  )
  await knex.schema.alterTable('company_sales', (table) => {
    table.string('bill_number', 32).nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex('company_sales').where({ status: 'draft' }).del()

  await knex.schema.alterTable('company_sales', (table) => {
    table.string('bill_number', 32).notNullable().alter()
  })
  await knex.raw(
    "ALTER TABLE `company_sales` MODIFY COLUMN `payment_method` ENUM('cash', 'card', 'other') NOT NULL",
  )
  await knex.raw(
    "ALTER TABLE `company_sales` MODIFY COLUMN `status` ENUM('completed', 'void') NOT NULL DEFAULT 'completed'",
  )
}
