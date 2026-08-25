import type { Knex } from 'knex'

/** Staff calendar lists events via workflow staff_id; PK is (item_id, staff_id). */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_service_workflow_staff', (table) => {
    table.index(['staff_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_service_workflow_staff', (table) => {
    table.dropIndex(['staff_id'])
  })
}
