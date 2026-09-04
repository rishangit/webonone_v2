import type { Knex } from 'knex'
import { allocateUniqueCompanyWebSlug } from '../src/utils/companyWebSlug.js'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.string('web_slug', 63).nullable()
  })

  const rows = await knex<{ id: string; name: string }>('companies').select('id', 'name')
  const taken = new Set<string>()
  for (const row of rows) {
    const slug = await allocateUniqueCompanyWebSlug(row.name, async (candidate) => taken.has(candidate))
    taken.add(slug)
    await knex('companies').where({ id: row.id }).update({ web_slug: slug })
  }

  await knex.raw('ALTER TABLE companies MODIFY COLUMN web_slug VARCHAR(63) NOT NULL')
  await knex.schema.alterTable('companies', (table) => {
    table.unique(['web_slug'], { indexName: 'uniq_companies_web_slug' })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.dropUnique(['web_slug'], 'uniq_companies_web_slug')
    table.dropColumn('web_slug')
  })
}
