import type { Knex } from 'knex'

const TABLES = ['company_products', 'company_services', 'company_spaces'] as const

const WITH_COMPLETED =
  "ENUM('draft', 'completed', 'published') NOT NULL DEFAULT 'draft'"
const WITHOUT_COMPLETED = "ENUM('draft', 'published') NOT NULL DEFAULT 'draft'"

export async function up(knex: Knex): Promise<void> {
  for (const table of TABLES) {
    await knex.raw(
      `ALTER TABLE \`${table}\` MODIFY COLUMN \`web_publish_status\` ${WITH_COMPLETED}`,
    )
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const table of TABLES) {
    await knex(table).where({ web_publish_status: 'completed' }).update({ web_publish_status: 'draft' })
    await knex.raw(
      `ALTER TABLE \`${table}\` MODIFY COLUMN \`web_publish_status\` ${WITHOUT_COMPLETED}`,
    )
  }
}
