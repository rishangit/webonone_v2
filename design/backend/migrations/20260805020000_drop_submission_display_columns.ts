import type { Knex } from 'knex'

/** Drop denormalized display columns — resolve from related sources at read time. */
export async function up(knex: Knex): Promise<void> {
  const has = await knex.schema.hasTable('design_form_submissions')
  if (!has) return

  const columns = [
    'form_name',
    'subject_display_name',
    'subject_email',
    'filled_by_display_name',
    'service_name',
  ] as const

  for (const column of columns) {
    const exists = await knex.schema.hasColumn('design_form_submissions', column)
    if (!exists) continue
    await knex.schema.alterTable('design_form_submissions', (table) => {
      table.dropColumn(column)
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  const has = await knex.schema.hasTable('design_form_submissions')
  if (!has) return

  if (!(await knex.schema.hasColumn('design_form_submissions', 'form_name'))) {
    await knex.schema.alterTable('design_form_submissions', (table) => {
      table.string('form_name', 255).notNullable().defaultTo('')
    })
  }
  if (!(await knex.schema.hasColumn('design_form_submissions', 'subject_display_name'))) {
    await knex.schema.alterTable('design_form_submissions', (table) => {
      table.string('subject_display_name', 255).notNullable().defaultTo('')
    })
  }
  if (!(await knex.schema.hasColumn('design_form_submissions', 'subject_email'))) {
    await knex.schema.alterTable('design_form_submissions', (table) => {
      table.string('subject_email', 255).nullable()
    })
  }
  if (!(await knex.schema.hasColumn('design_form_submissions', 'filled_by_display_name'))) {
    await knex.schema.alterTable('design_form_submissions', (table) => {
      table.string('filled_by_display_name', 255).notNullable().defaultTo('')
    })
  }
  if (!(await knex.schema.hasColumn('design_form_submissions', 'service_name'))) {
    await knex.schema.alterTable('design_form_submissions', (table) => {
      table.string('service_name', 255).nullable()
    })
  }
}
