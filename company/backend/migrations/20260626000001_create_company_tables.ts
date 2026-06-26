import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('super_admins', (table) => {
    table.string('id', 21).primary()
    table.string('email', 255).notNullable().unique()
    table.string('password_hash', 255).notNullable()
    table.string('display_name', 255).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  await knex.schema.createTable('companies', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable()
    table.string('logo_url', 2048).nullable()
    table.enum('status', ['pending', 'approved']).notNullable().defaultTo('pending')
    table.string('created_by_user_id', 21).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('approved_at', { precision: 3 }).nullable()
    table.string('approved_by_super_admin_id', 21).nullable()
    table
      .foreign('approved_by_super_admin_id')
      .references('id')
      .inTable('super_admins')
      .onDelete('SET NULL')
    table.index(['status'])
    table.index(['created_by_user_id'])
  })

  await knex.schema.createTable('company_memberships', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('user_id', 21).notNullable().unique()
    table.enum('role', ['member', 'company_admin']).notNullable().defaultTo('member')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.index(['company_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_memberships')
  await knex.schema.dropTableIfExists('companies')
  await knex.schema.dropTableIfExists('super_admins')
}
