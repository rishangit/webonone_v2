import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users_roles', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable()
    table.enum('role', ['super_admin', 'company_admin', 'member']).notNullable()
    table.string('company_id', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.unique(['user_id', 'company_id', 'role'])
    table.index(['user_id'])
    table.index(['company_id'])
  })

  const memberships = await knex('company_memberships').select('*')
  if (memberships.length > 0) {
    await knex('users_roles').insert(
      memberships.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        role: row.role,
        company_id: row.company_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    )
  }

  const superAdminUserId = process.env.SUPER_ADMIN_USER_ID?.trim()
  const superAdmins = await knex('super_admins').select('id')
  if (superAdminUserId && superAdmins.length > 0) {
    const existing = await knex('users_roles')
      .where({ user_id: superAdminUserId, role: 'super_admin' })
      .first()
    if (!existing) {
      await knex('users_roles').insert({
        id: nanoid(),
        user_id: superAdminUserId,
        role: 'super_admin',
        company_id: null,
      })
    }
  }

  await knex('companies').update({ approved_by_super_admin_id: null })

  await knex.schema.alterTable('companies', (table) => {
    table.dropForeign(['approved_by_super_admin_id'])
  })

  await knex.schema.alterTable('companies', (table) => {
    table.renameColumn('approved_by_super_admin_id', 'approved_by_user_id')
  })

  await knex.schema.dropTableIfExists('company_memberships')
  await knex.schema.dropTableIfExists('super_admins')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('super_admins', (table) => {
    table.string('id', 21).primary()
    table.string('email', 255).notNullable().unique()
    table.string('password_hash', 255).nullable()
    table.string('display_name', 255).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  await knex.schema.alterTable('companies', (table) => {
    table.renameColumn('approved_by_user_id', 'approved_by_super_admin_id')
  })

  await knex.schema.alterTable('companies', (table) => {
    table
      .foreign('approved_by_super_admin_id')
      .references('id')
      .inTable('super_admins')
      .onDelete('SET NULL')
  })

  await knex.schema.createTable('company_memberships', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('user_id', 21).notNullable()
    table.enum('role', ['member', 'company_admin']).notNullable().defaultTo('member')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.index(['company_id'])
  })

  const companyRoles = await knex('users_roles').whereNotNull('company_id')
  if (companyRoles.length > 0) {
    await knex('company_memberships').insert(
      companyRoles.map((row) => ({
        id: row.id,
        company_id: row.company_id,
        user_id: row.user_id,
        role: row.role === 'super_admin' ? 'member' : row.role,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    )
  }

  await knex.schema.dropTableIfExists('users_roles')
}
