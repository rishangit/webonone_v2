import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('data_product_tags', (table) => {
    table.string('product_id', 21).notNullable().references('id').inTable('data_products').onDelete('CASCADE')
    table.string('tag_id', 21).notNullable().references('id').inTable('data_tags').onDelete('CASCADE')
    table.primary(['product_id', 'tag_id'])
  })

  await knex.schema.createTable('data_service_tags', (table) => {
    table.string('service_id', 21).notNullable().references('id').inTable('data_services').onDelete('CASCADE')
    table.string('tag_id', 21).notNullable().references('id').inTable('data_tags').onDelete('CASCADE')
    table.primary(['service_id', 'tag_id'])
  })

  await knex.schema.createTable('data_space_tags', (table) => {
    table.string('space_id', 21).notNullable().references('id').inTable('data_spaces').onDelete('CASCADE')
    table.string('tag_id', 21).notNullable().references('id').inTable('data_tags').onDelete('CASCADE')
    table.primary(['space_id', 'tag_id'])
  })

  await knex.schema.createTable('data_product_attributes', (table) => {
    table.string('product_id', 21).notNullable().references('id').inTable('data_products').onDelete('CASCADE')
    table.string('attribute_id', 21).notNullable().references('id').inTable('data_attributes').onDelete('RESTRICT')
    table.text('value_text').nullable()
    table.decimal('value_number', 18, 6).nullable()
    table.primary(['product_id', 'attribute_id'])
  })

  await knex.schema.createTable('data_service_attributes', (table) => {
    table.string('service_id', 21).notNullable().references('id').inTable('data_services').onDelete('CASCADE')
    table.string('attribute_id', 21).notNullable().references('id').inTable('data_attributes').onDelete('RESTRICT')
    table.text('value_text').nullable()
    table.decimal('value_number', 18, 6).nullable()
    table.primary(['service_id', 'attribute_id'])
  })

  await knex.schema.createTable('data_space_attributes', (table) => {
    table.string('space_id', 21).notNullable().references('id').inTable('data_spaces').onDelete('CASCADE')
    table.string('attribute_id', 21).notNullable().references('id').inTable('data_attributes').onDelete('RESTRICT')
    table.text('value_text').nullable()
    table.decimal('value_number', 18, 6).nullable()
    table.primary(['space_id', 'attribute_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_space_attributes')
  await knex.schema.dropTableIfExists('data_service_attributes')
  await knex.schema.dropTableIfExists('data_product_attributes')
  await knex.schema.dropTableIfExists('data_space_tags')
  await knex.schema.dropTableIfExists('data_service_tags')
  await knex.schema.dropTableIfExists('data_product_tags')
}
