import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payment_companies', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.datetime('activated_at', { precision: 3 }).nullable()
    table.enum('status', ['active', 'inactive']).notNullable().defaultTo('inactive')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['status'])
  })

  await knex.schema.createTable('payment_plans', (table) => {
    table.string('id', 21).primary()
    table.string('slug', 64).notNullable().unique()
    table.string('name', 255).notNullable()
    table.bigInteger('amount_minor').notNullable()
    table.string('currency', 3).notNullable().defaultTo('LKR')
    table.enum('interval', ['month']).notNullable().defaultTo('month')
    table.boolean('active').notNullable().defaultTo(true)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  await knex.schema.createTable('payment_audit_log', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).nullable()
    table.string('action', 64).notNullable()
    table.string('entity_type', 64).notNullable()
    table.string('entity_id', 21).nullable()
    table.text('metadata_json').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['entity_type', 'entity_id'])
  })

  const planId = nanoid()
  await knex('payment_plans').insert({
    id: planId,
    slug: 'platform_monthly',
    name: 'Platform subscription',
    amount_minor: 300000,
    currency: 'LKR',
    interval: 'month',
    active: true,
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_audit_log')
  await knex.schema.dropTableIfExists('payment_plans')
  await knex.schema.dropTableIfExists('payment_companies')
}
