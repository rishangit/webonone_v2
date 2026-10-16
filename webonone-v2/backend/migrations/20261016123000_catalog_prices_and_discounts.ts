import type { Knex } from 'knex'

const KINDS = ['services', 'spaces'] as const

type LegacyPriceRule = {
  id: string
  company_id: string
  entity_kind: string
  entity_id: string
  price: string | number
  apply_when: string
  apply_to: string
  created_at: Date | string
  updated_at: Date | string
}

function activeScore(row: LegacyPriceRule): number {
  return (row.apply_when === 'all_time' ? 2 : 0) + (row.apply_to === 'everyone' ? 1 : 0)
}

function createdAtMs(value: Date | string): number {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

async function createPricesTable(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_catalog_prices', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('entity_kind', 16).notNullable()
    table.string('entity_id', 21).notNullable()
    table.decimal('price', 19, 4).notNullable()
    table.boolean('is_active').notNullable().defaultTo(false)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.index(['company_id', 'entity_kind', 'entity_id'], 'catalog_prices_entity_idx')
  })
}

async function createDiscountsTables(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_catalog_discounts', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('entity_kind', 16).notNullable()
    table.string('entity_id', 21).notNullable()
    table.decimal('percent', 5, 2).notNullable()
    table.string('apply_when', 32).notNullable()
    table.json('weekdays').nullable()
    table.string('start_date', 10).nullable()
    table.string('end_date', 10).nullable()
    table.string('apply_to', 32).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.index(['company_id', 'entity_kind', 'entity_id'], 'catalog_discounts_entity_idx')
  })

  await knex.schema.createTable('company_catalog_discount_users', (table) => {
    table.string('discount_id', 21).notNullable()
    table.string('user_id', 21).notNullable()
    table.primary(['discount_id', 'user_id'])
    table
      .foreign('discount_id')
      .references('id')
      .inTable('company_catalog_discounts')
      .onDelete('CASCADE')
  })
}

/** Copy legacy schedule prices into price rows. One row per entity stays active. */
async function copyLegacyPrices(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('company_catalog_price_rules'))) return
  const rows = (await knex('company_catalog_price_rules').select(
    'id',
    'company_id',
    'entity_kind',
    'entity_id',
    'price',
    'apply_when',
    'apply_to',
    'created_at',
    'updated_at',
  )) as LegacyPriceRule[]
  const groups = new Map<string, LegacyPriceRule[]>()
  for (const row of rows) {
    if (!KINDS.includes(row.entity_kind as (typeof KINDS)[number])) continue
    const key = `${row.company_id}:${row.entity_kind}:${row.entity_id}`
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }
  const inserts: Record<string, unknown>[] = []
  for (const group of groups.values()) {
    const ranked = [...group].sort((a, b) => {
      const score = activeScore(b) - activeScore(a)
      if (score !== 0) return score
      return createdAtMs(b.created_at) - createdAtMs(a.created_at)
    })
    const activeId = ranked[0]?.id
    for (const row of group) {
      inserts.push({
        id: row.id,
        company_id: row.company_id,
        entity_kind: row.entity_kind,
        entity_id: row.entity_id,
        price: row.price,
        is_active: row.id === activeId,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    }
  }
  if (inserts.length > 0) {
    await knex('company_catalog_prices').insert(inserts)
  }
}

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('company_catalog_prices'))) {
    await createPricesTable(knex)
  }
  if (!(await knex.schema.hasTable('company_catalog_discounts'))) {
    await createDiscountsTables(knex)
  }
  await copyLegacyPrices(knex)
  await knex.schema.dropTableIfExists('company_catalog_price_rule_users')
  await knex.schema.dropTableIfExists('company_catalog_price_rules')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_catalog_discount_users')
  await knex.schema.dropTableIfExists('company_catalog_discounts')
  await knex.schema.dropTableIfExists('company_catalog_prices')

  await knex.schema.createTable('company_catalog_price_rules', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.enum('entity_kind', [...KINDS]).notNullable()
    table.string('entity_id', 21).notNullable()
    table.decimal('price', 18, 2).notNullable()
    table.enum('apply_when', ['all_time', 'selected_days']).notNullable()
    table.json('weekdays').nullable()
    table.time('start_time').nullable()
    table.time('end_time').nullable()
    table.enum('apply_to', ['everyone', 'selected_users']).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.index(['company_id', 'entity_kind', 'entity_id'], 'catalog_price_rules_entity_idx')
  })

  await knex.schema.createTable('company_catalog_price_rule_users', (table) => {
    table.string('rule_id', 21).notNullable()
    table.string('user_id', 21).notNullable()
    table.primary(['rule_id', 'user_id'])
    table
      .foreign('rule_id')
      .references('id')
      .inTable('company_catalog_price_rules')
      .onDelete('CASCADE')
  })
}
