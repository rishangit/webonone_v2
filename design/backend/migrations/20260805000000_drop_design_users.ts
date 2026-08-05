import type { Knex } from 'knex'

/**
 * Removes local `design_users` profile copies. User refs stay as Identity ids
 * (CHAR(21) JWT `sub`) with no cross-service FK.
 */
export async function up(knex: Knex): Promise<void> {
  const hasTemplates = await knex.schema.hasTable('design_form_templates')
  if (hasTemplates) {
    try {
      await knex.schema.alterTable('design_form_templates', (table) => {
        table.dropForeign(['created_by'])
      })
    } catch {
      // Fresh installs already create created_by without an FK.
    }
  }

  await knex.schema.dropTableIfExists('design_users')
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('design_users')
  if (exists) return

  await knex.schema.createTable('design_users', (table) => {
    table.string('id', 21).primary()
    table.string('email', 255).notNullable()
    table.string('display_name', 255).notNullable().defaultTo('')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['email'])
  })

  const hasTemplates = await knex.schema.hasTable('design_form_templates')
  if (!hasTemplates) return

  const ids = (await knex('design_form_templates')
    .distinct('created_by')
    .whereNotNull('created_by')
    .pluck('created_by')) as string[]

  for (const id of ids) {
    await knex('design_users').insert({
      id,
      email: `${id}@users.local`,
      display_name: '',
      created_at: knex.fn.now(3),
      updated_at: knex.fn.now(3),
    })
  }

  await knex.schema.alterTable('design_form_templates', (table) => {
    table.foreign('created_by').references('id').inTable('design_users').onDelete('SET NULL')
  })
}
