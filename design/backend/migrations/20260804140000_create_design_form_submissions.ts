import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('design_form_submissions')
  if (exists) {
    await knex.schema.dropTable('design_form_submissions')
  }

  await knex.schema.createTable('design_form_submissions', (table) => {
    table.string('id', 21).primary()
    // WebOnOne company id copy — no local companies FK
    table.string('company_id', 21).notNullable()
    table.string('form_template_id', 21).notNullable()
    // Identity user id copies
    table.string('subject_user_id', 21).notNullable()
    table.string('filled_by_user_id', 21).notNullable()
    // Data service id copy (optional)
    table.string('service_id', 21).nullable()
    table.json('answers').notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))

    table
      .foreign('form_template_id')
      .references('id')
      .inTable('design_form_templates')
      .onDelete('RESTRICT')
    table.index(['company_id', 'subject_user_id'], 'dfs_company_subject_idx')
    table.index(['company_id', 'filled_by_user_id'], 'dfs_company_filled_by_idx')
    table.index(['company_id', 'form_template_id'], 'dfs_company_form_idx')
    table.index(['created_at'], 'dfs_created_at_idx')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('design_form_submissions')
}
