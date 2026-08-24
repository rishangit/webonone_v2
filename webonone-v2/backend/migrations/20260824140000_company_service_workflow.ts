import { nanoid } from 'nanoid'
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_service_workflow_items', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('service_id', 21).notNullable()
    table.string('space_id', 21).notNullable()
    table.integer('sort_order').unsigned().notNullable()
    table
      .foreign('company_id')
      .references('id')
      .inTable('companies')
      .onDelete('CASCADE')
    table
      .foreign('service_id')
      .references('id')
      .inTable('company_services')
      .onDelete('CASCADE')
    table
      .foreign('space_id')
      .references('id')
      .inTable('company_spaces')
      .onDelete('RESTRICT')
    table.unique(['service_id', 'space_id'])
    table.index(['service_id', 'sort_order'])
  })

  await knex.schema.createTable('company_service_workflow_staff', (table) => {
    table.string('item_id', 21).notNullable()
    table.string('staff_id', 21).notNullable()
    table.primary(['item_id', 'staff_id'])
    table
      .foreign('item_id')
      .references('id')
      .inTable('company_service_workflow_items')
      .onDelete('CASCADE')
    table
      .foreign('staff_id')
      .references('id')
      .inTable('company_staff')
      .onDelete('CASCADE')
  })

  await knex.schema.createTable('company_service_workflow_forms', (table) => {
    table.string('item_id', 21).notNullable()
    table.string('form_template_id', 21).notNullable()
    table.primary(['item_id', 'form_template_id'])
    table
      .foreign('item_id')
      .references('id')
      .inTable('company_service_workflow_items')
      .onDelete('CASCADE')
  })

  const hasOld = await knex.schema.hasTable('company_service_spaces')
  if (hasOld) {
    const links = await knex('company_service_spaces')
      .select('company_id', 'service_id', 'space_id', 'sort_order')
      .orderBy(['service_id', 'sort_order'])
    if (links.length > 0) {
      await knex('company_service_workflow_items').insert(
        links.map((link) => ({
          id: nanoid(),
          company_id: link.company_id,
          service_id: link.service_id,
          space_id: link.space_id,
          sort_order: Number(link.sort_order) + 1,
        })),
      )
    }
    await knex.schema.dropTableIfExists('company_service_spaces')
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_service_spaces', (table) => {
    table.string('company_id', 21).notNullable()
    table.string('service_id', 21).notNullable()
    table.string('space_id', 21).notNullable()
    table.integer('sort_order').unsigned().notNullable()
    table.primary(['service_id', 'space_id'])
    table.index(['company_id', 'service_id', 'sort_order'])
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.foreign('service_id').references('id').inTable('company_services').onDelete('CASCADE')
    table.foreign('space_id').references('id').inTable('company_spaces').onDelete('CASCADE')
  })

  const items = await knex('company_service_workflow_items')
    .select('company_id', 'service_id', 'space_id', 'sort_order')
    .orderBy(['service_id', 'sort_order'])
  if (items.length > 0) {
    await knex('company_service_spaces').insert(
      items.map((item) => ({
        company_id: item.company_id,
        service_id: item.service_id,
        space_id: item.space_id,
        sort_order: Math.max(0, Number(item.sort_order) - 1),
      })),
    )
  }

  await knex.schema.dropTableIfExists('company_service_workflow_forms')
  await knex.schema.dropTableIfExists('company_service_workflow_staff')
  await knex.schema.dropTableIfExists('company_service_workflow_items')
}
