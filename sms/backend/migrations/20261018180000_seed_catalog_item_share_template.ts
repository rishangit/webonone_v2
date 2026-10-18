import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const SLUG = 'catalog_item_share'
const BODY =
  '{{companyName}} shared {{itemName}} ({{itemKind}}) with you: {{shareUrl}}'
const REQUIRED_KEYS = ['companyName', 'itemName', 'itemKind', 'shareUrl']

export async function up(knex: Knex): Promise<void> {
  const existing = await knex('sms_templates')
    .where({ slug: SLUG, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (existing) {
    return
  }

  const id = nanoid()
  await knex('sms_templates').insert({
    id,
    slug: SLUG,
    name: 'Catalog item share',
    body: BODY,
    scope: 'platform',
    company_id: null,
    is_active: true,
    required_keys: JSON.stringify(REQUIRED_KEYS),
    created_at: knex.fn.now(3),
    updated_at: knex.fn.now(3),
  })

  await knex('sms_template_versions').insert({
    id: nanoid(),
    template_id: id,
    body: BODY,
    version_number: 1,
    created_by: null,
    created_at: knex.fn.now(3),
  })
}

export async function down(knex: Knex): Promise<void> {
  const row = await knex('sms_templates')
    .where({ slug: SLUG, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (!row) return

  await knex('sms_template_versions').where({ template_id: row.id }).del()
  await knex('sms_templates').where({ id: row.id }).del()
}
