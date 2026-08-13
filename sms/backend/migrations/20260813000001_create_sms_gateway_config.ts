import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sms_gateway_config', (table) => {
    table.string('id', 21).primary()
    table.enum('scope', ['platform', 'company']).notNullable().defaultTo('platform')
    table
      .string('company_id', 21)
      .nullable()
      .references('id')
      .inTable('sms_companies')
      .onDelete('CASCADE')
    table.enum('mode', ['mobile_device', 'text_lk']).notNullable().defaultTo('mobile_device')
    table.string('sender_id', 11).nullable()
    table.text('api_token_enc').nullable()
    table.string('updated_by', 21).nullable()
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['scope', 'company_id'])
    table.index(['mode'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sms_gateway_config')
}
