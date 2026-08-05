import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_services', (table) => {
    /** Cross-service ID copy of Design `design_form_templates.id` (no FK). */
    table.string('form_template_id', 21).nullable()
    table.index(['company_id', 'form_template_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_services', (table) => {
    table.dropIndex(['company_id', 'form_template_id'])
    table.dropColumn('form_template_id')
  })
}
