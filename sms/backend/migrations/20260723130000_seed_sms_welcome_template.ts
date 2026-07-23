import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

/**
 * Seed platform SMS `welcome` template for company customer greetings (1.13.6).
 */
export async function up(knex: Knex): Promise<void> {
  const existing = await knex('sms_templates')
    .where({ slug: 'welcome', scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (existing) {
    return
  }

  const id = nanoid()
  await knex('sms_templates').insert({
    id,
    slug: 'welcome',
    name: 'Welcome',
    body: 'Welcome to {{companyName}}, {{userName}}!',
    scope: 'platform',
    company_id: null,
    is_active: true,
    required_keys: JSON.stringify(['userName', 'companyName']),
    created_at: knex.fn.now(3),
    updated_at: knex.fn.now(3),
  })

  await knex('sms_template_versions').insert({
    id: nanoid(),
    template_id: id,
    body: 'Welcome to {{companyName}}, {{userName}}!',
    version_number: 1,
    created_by: null,
    created_at: knex.fn.now(3),
  })
}

export async function down(knex: Knex): Promise<void> {
  const row = await knex('sms_templates')
    .where({ slug: 'welcome', scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (!row) return

  await knex('sms_template_versions').where({ template_id: row.id }).del()
  await knex('sms_templates').where({ id: row.id }).del()
}
