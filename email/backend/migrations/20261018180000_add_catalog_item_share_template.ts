import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'catalog_item_share',
  name: 'Catalog item share',
  subject: '{{companyName}} shared {{itemName}} with you',
  requiredKeys: ['companyName', 'itemName', 'itemKind', 'shareUrl'],
  html_body: `<p>Hello,</p>
<p><strong>{{companyName}}</strong> shared a {{itemKind}} with you: <strong>{{itemName}}</strong>.</p>
<p><a href="{{shareUrl}}">View {{itemName}}</a></p>
{{footerHtml}}`,
  text_body: `Hello,

{{companyName}} shared a {{itemKind}} with you: {{itemName}}.

View it here: {{shareUrl}}

{{footerHtml}}`,
} as const

export async function up(knex: Knex): Promise<void> {
  const existing = await knex('email_templates')
    .where({ slug: TEMPLATE.slug, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (existing) {
    return
  }

  const now = knex.fn.now(3)
  const id = nanoid()

  await knex('email_templates').insert({
    id,
    slug: TEMPLATE.slug,
    name: TEMPLATE.name,
    subject: TEMPLATE.subject,
    html_body: TEMPLATE.html_body,
    text_body: TEMPLATE.text_body,
    scope: 'platform',
    company_id: null,
    is_active: true,
    required_keys: JSON.stringify(TEMPLATE.requiredKeys),
    created_at: now,
    updated_at: now,
  })

  await knex('email_template_versions').insert({
    id: nanoid(),
    template_id: id,
    subject: TEMPLATE.subject,
    html_body: TEMPLATE.html_body,
    text_body: TEMPLATE.text_body,
    version_number: 1,
    created_by: null,
    created_at: now,
  })
}

export async function down(knex: Knex): Promise<void> {
  const row = await knex('email_templates')
    .where({ slug: TEMPLATE.slug, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (!row) return

  await knex('email_template_versions').where({ template_id: row.id }).del()
  await knex('email_templates').where({ id: row.id }).del()
}
