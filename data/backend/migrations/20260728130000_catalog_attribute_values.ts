import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const ENTITY_SPECS = [
  {
    linkTable: 'data_product_attributes',
    valuesTable: 'data_product_attribute_values',
    idCol: 'product_id',
    entityTable: 'data_products',
  },
  {
    linkTable: 'data_service_attributes',
    valuesTable: 'data_service_attribute_values',
    idCol: 'service_id',
    entityTable: 'data_services',
  },
  {
    linkTable: 'data_space_attributes',
    valuesTable: 'data_space_attribute_values',
    idCol: 'space_id',
    entityTable: 'data_spaces',
  },
] as const

export async function up(knex: Knex): Promise<void> {
  for (const spec of ENTITY_SPECS) {
    await knex.schema.createTable(spec.valuesTable, (table) => {
      table.string('id', 21).primary()
      table
        .string(spec.idCol, 21)
        .notNullable()
        .references('id')
        .inTable(spec.entityTable)
        .onDelete('CASCADE')
      table
        .string('attribute_id', 21)
        .notNullable()
        .references('id')
        .inTable('data_attributes')
        .onDelete('RESTRICT')
      table.text('value_text').nullable()
      table.decimal('value_number', 18, 6).nullable()
      table.timestamp('created_at', { useTz: false, precision: 3 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 3 }).notNullable()
      table.index([spec.idCol, 'attribute_id'])
    })

    const rows = await knex(spec.linkTable).select('*')
    const now = knex.fn.now(3)
    for (const row of rows) {
      const hasText = row.value_text != null && row.value_text !== ''
      const hasNumber = row.value_number != null
      if (!hasText && !hasNumber) continue
      await knex(spec.valuesTable).insert({
        id: nanoid(),
        [spec.idCol]: row[spec.idCol],
        attribute_id: row.attribute_id,
        value_text: hasText ? row.value_text : null,
        value_number: hasNumber ? row.value_number : null,
        created_at: now,
        updated_at: now,
      })
    }

    await knex.schema.alterTable(spec.linkTable, (table) => {
      table.dropColumn('value_text')
      table.dropColumn('value_number')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const spec of [...ENTITY_SPECS].reverse()) {
    await knex.schema.alterTable(spec.linkTable, (table) => {
      table.text('value_text').nullable()
      table.decimal('value_number', 18, 6).nullable()
    })

    const valueRows = await knex(spec.valuesTable).select('*').orderBy('created_at', 'asc')
    const seen = new Set<string>()
    for (const row of valueRows) {
      const key = `${row[spec.idCol]}:${row.attribute_id}`
      if (seen.has(key)) continue
      seen.add(key)
      await knex(spec.linkTable)
        .where({ [spec.idCol]: row[spec.idCol], attribute_id: row.attribute_id })
        .update({
          value_text: row.value_text,
          value_number: row.value_number,
        })
    }

    await knex.schema.dropTableIfExists(spec.valuesTable)
  }
}
