import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('google_sub', 255).nullable().unique()
    table.string('first_name', 100).nullable()
    table.string('last_name', 100).nullable()
    table.boolean('is_email_verified').notNullable().defaultTo(false)
    table.string('avatar_url', 512).nullable()
    table.string('locale', 20).nullable()
    table.string('phone_number', 32).nullable()
    table.string('address_line_1', 255).nullable()
    table.string('address_line_2', 255).nullable()
    table.string('city', 100).nullable()
    table.string('state_region', 100).nullable()
    table.string('postal_code', 20).nullable()
    table.string('country', 2).nullable()
  })

  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).nullable().alter()
  })

  const users = await knex('users').select('id', 'display_name')
  for (const user of users) {
    const displayName = (user.display_name as string) ?? ''
    const spaceIndex = displayName.indexOf(' ')
    const firstName = spaceIndex > 0 ? displayName.slice(0, spaceIndex) : displayName
    const lastName = spaceIndex > 0 ? displayName.slice(spaceIndex + 1) : ''
    await knex('users').where({ id: user.id }).update({
      first_name: firstName,
      last_name: lastName,
    })
  }

  await knex.schema.alterTable('users', (table) => {
    table.string('first_name', 100).notNullable().alter()
    table.string('last_name', 100).notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('google_sub')
    table.dropColumn('first_name')
    table.dropColumn('last_name')
    table.dropColumn('is_email_verified')
    table.dropColumn('avatar_url')
    table.dropColumn('locale')
    table.dropColumn('phone_number')
    table.dropColumn('address_line_1')
    table.dropColumn('address_line_2')
    table.dropColumn('city')
    table.dropColumn('state_region')
    table.dropColumn('postal_code')
    table.dropColumn('country')
  })

  await knex('users').whereNull('password_hash').del()

  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).notNullable().alter()
  })
}
