import type { Knex } from 'knex'

/**
 * Removes local `design_companies` stubs. Company refs stay as WebOnOne ids
 * (CHAR(21) JWT `company_id`); details are loaded via WebOnOne internal HTTP API.
 */
export async function up(knex: Knex): Promise<void> {
  const dropFk = async (tableName: string, column: string) => {
    const hasTable = await knex.schema.hasTable(tableName)
    if (!hasTable) return
    try {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropForeign([column])
      })
    } catch {
      // Fresh installs may already omit the FK.
    }
  }

  await dropFk('design_form_templates', 'company_id')
  await dropFk('design_form_submissions', 'company_id')
  await knex.schema.dropTableIfExists('design_companies')
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('design_companies')
  if (exists) return

  await knex.schema.createTable('design_companies', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  const companyIds = new Set<string>()

  if (await knex.schema.hasTable('design_form_templates')) {
    const ids = (await knex('design_form_templates').distinct('company_id').pluck('company_id')) as string[]
    for (const id of ids) companyIds.add(id)
  }
  if (await knex.schema.hasTable('design_form_submissions')) {
    const ids = (await knex('design_form_submissions').distinct('company_id').pluck('company_id')) as string[]
    for (const id of ids) companyIds.add(id)
  }

  for (const id of companyIds) {
    await knex('design_companies').insert({
      id,
      name: id,
      created_at: knex.fn.now(3),
      updated_at: knex.fn.now(3),
    })
  }

  if (await knex.schema.hasTable('design_form_templates')) {
    await knex.schema.alterTable('design_form_templates', (table) => {
      table.foreign('company_id').references('id').inTable('design_companies').onDelete('CASCADE')
    })
  }
  if (await knex.schema.hasTable('design_form_submissions')) {
    await knex.schema.alterTable('design_form_submissions', (table) => {
      table.foreign('company_id').references('id').inTable('design_companies').onDelete('CASCADE')
    })
  }
}
