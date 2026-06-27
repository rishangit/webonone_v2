import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.text('description').nullable()
    table.string('company_size', 32).nullable()
    table.string('address_line1', 255).nullable()
    table.string('address_line2', 255).nullable()
    table.string('city', 128).nullable()
    table.string('state_region', 128).nullable()
    table.string('postal_code', 32).nullable()
    table.string('country', 128).nullable()
    table.string('contact_email', 255).nullable()
    table.string('contact_phone', 64).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.dropColumn('description')
    table.dropColumn('company_size')
    table.dropColumn('address_line1')
    table.dropColumn('address_line2')
    table.dropColumn('city')
    table.dropColumn('state_region')
    table.dropColumn('postal_code')
    table.dropColumn('country')
    table.dropColumn('contact_email')
    table.dropColumn('contact_phone')
  })
}
