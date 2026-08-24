import { nanoid } from 'nanoid'
import type { Knex } from 'knex'

async function hasColumn(knex: Knex, table: string, column: string): Promise<boolean> {
  const [rows] = await knex.raw<[Array<{ COLUMN_NAME: string }>]>(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  )
  return Array.isArray(rows) && rows.length > 0
}

async function hasIndex(knex: Knex, table: string, indexName: string): Promise<boolean> {
  const [rows] = await knex.raw<[Array<{ Key_name: string }>]>(
    'SHOW INDEX FROM ?? WHERE Key_name = ?',
    [table, indexName],
  )
  return Array.isArray(rows) && rows.length > 0
}

async function dropForeignIfExists(knex: Knex, table: string, indexName: string): Promise<void> {
  const [rows] = await knex.raw<[Array<{ CONSTRAINT_NAME: string }>]>(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
       AND CONSTRAINT_NAME = ?`,
    [table, indexName],
  )
  if (Array.isArray(rows) && rows.length > 0) {
    await knex.raw('ALTER TABLE ?? DROP FOREIGN KEY ??', [table, indexName])
  }
}

export async function up(knex: Knex): Promise<void> {
  const table = 'company_service_workflow_items'

  await dropForeignIfExists(knex, table, `${table}_space_id_foreign`)
  if (await hasIndex(knex, table, `${table}_service_id_space_id_unique`)) {
    await knex.schema.alterTable(table, (t) => {
      t.dropUnique(['service_id', 'space_id'])
    })
  }

  if (!(await hasColumn(knex, table, 'kind'))) {
    await knex.schema.alterTable(table, (t) => {
      t.string('kind', 20).notNullable().defaultTo('space')
    })
  }

  await knex.raw('ALTER TABLE company_service_workflow_items MODIFY space_id VARCHAR(21) NULL')

  await dropForeignIfExists(knex, table, `${table}_space_id_foreign`)
  await knex.schema.alterTable(table, (t) => {
    t.foreign('space_id').references('id').inTable('company_spaces').onDelete('RESTRICT')
  })

  const spaceCount = await knex(table).where({ kind: 'space' }).min({ minSort: 'sort_order' }).first()
  const minSpaceSort = Number(spaceCount?.minSort ?? 0)
  if (minSpaceSort === 1) {
    await knex(table).where({ kind: 'space' }).increment('sort_order', 1)
  }

  const services = await knex('company_services').select('id', 'company_id')
  const existingCheckIn = await knex(table).where({ kind: 'check_in' }).select('service_id')
  const hasCheckIn = new Set(existingCheckIn.map((row) => row.service_id as string))
  const missing = services.filter((service) => !hasCheckIn.has(service.id as string))
  if (missing.length > 0) {
    await knex(table).insert(
      missing.map((service) => ({
        id: nanoid(),
        company_id: service.company_id,
        service_id: service.id,
        space_id: null,
        kind: 'check_in',
        sort_order: 1,
      })),
    )
  }

  const checkInsExists = await knex.schema.hasTable('company_event_session_check_ins')
  if (!checkInsExists) {
    await knex.schema.createTable('company_event_session_check_ins', (t) => {
      t.string('id', 21).primary()
      t.string('company_id', 21).notNullable()
      t.string('event_id', 21).notNullable()
      t.date('occurrence_date').notNullable()
      t.string('user_id', 21).notNullable()
      t.string('user_display_name', 255).notNullable()
      t.string('user_email', 255).nullable()
      t.datetime('checked_in_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      t.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
      t.foreign('event_id').references('id').inTable('company_events').onDelete('CASCADE')
      t.unique(['event_id', 'occurrence_date', 'user_id'], {
        indexName: 'uniq_session_check_in_user',
      })
      t.index(['company_id', 'event_id', 'occurrence_date'], 'idx_session_check_ins_lookup')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_event_session_check_ins')

  await knex('company_service_workflow_items').where({ kind: 'check_in' }).delete()
  await knex('company_service_workflow_items').where('sort_order', '>', 1).decrement('sort_order', 1)

  await dropForeignIfExists(
    knex,
    'company_service_workflow_items',
    'company_service_workflow_items_space_id_foreign',
  )

  if (await hasColumn(knex, 'company_service_workflow_items', 'kind')) {
    await knex.schema.alterTable('company_service_workflow_items', (table) => {
      table.dropColumn('kind')
    })
  }

  await knex.raw(
    'ALTER TABLE company_service_workflow_items MODIFY space_id VARCHAR(21) NOT NULL',
  )

  await knex.schema.alterTable('company_service_workflow_items', (table) => {
    table
      .foreign('space_id')
      .references('id')
      .inTable('company_spaces')
      .onDelete('RESTRICT')
    table.unique(['service_id', 'space_id'])
  })
}
