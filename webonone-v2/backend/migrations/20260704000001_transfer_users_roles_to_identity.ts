import type { Knex } from 'knex'
import knex from 'knex'

export async function up(knexInstance: Knex): Promise<void> {
  const hasTable = await knexInstance.schema.hasTable('users_roles')
  if (!hasTable) {
    return
  }

  const rows = await knexInstance('users_roles').select('*')
  if (rows.length > 0) {
    const identityDbName = process.env.IDENTITY_DB_NAME?.trim() || 'identity'
    const identityKnex = knex({
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 3306),
        user: process.env.DB_USER ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: identityDbName,
      },
    })

    try {
      const hasIdentityTable = await identityKnex.schema.hasTable('users_roles')
      if (hasIdentityTable) {
        for (const row of rows) {
          const existing = await identityKnex('users_roles').where({ id: row.id }).first()
          if (!existing) {
            await identityKnex('users_roles').insert(row)
          }
        }
      }
    } finally {
      await identityKnex.destroy()
    }
  }

  await knexInstance.schema.dropTableIfExists('users_roles')
}

export async function down(knexInstance: Knex): Promise<void> {
  await knexInstance.schema.createTable('users_roles', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable()
    table.enum('role', ['super_admin', 'company_admin', 'member']).notNullable()
    table.string('company_id', 21).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knexInstance.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knexInstance.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.unique(['user_id', 'company_id', 'role'])
    table.index(['user_id'])
    table.index(['company_id'])
  })
}
