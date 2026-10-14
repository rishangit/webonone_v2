import type { Knex } from 'knex'

const WEB_PUBLISH_STATUSES = ['draft', 'published'] as const
const SELLABLE_TABLES = ['company_products', 'company_services', 'company_spaces'] as const

export async function up(knex: Knex): Promise<void> {
  for (const table of SELLABLE_TABLES) {
    await knex.schema.alterTable(table, (t) => {
      t.enum('web_publish_status', [...WEB_PUBLISH_STATUSES])
        .notNullable()
        .defaultTo('draft')
        .after('status')
    })
    await knex.schema.alterTable(table, (t) => {
      t.index(['company_id', 'web_publish_status'], `${table}_company_web_publish_idx`)
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const table of SELLABLE_TABLES) {
    await knex.schema.alterTable(table, (t) => {
      t.dropIndex(['company_id', 'web_publish_status'], `${table}_company_web_publish_idx`)
      t.dropColumn('web_publish_status')
    })
  }
}
