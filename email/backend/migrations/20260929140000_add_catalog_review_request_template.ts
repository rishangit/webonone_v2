import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'catalog_review_request',
  name: 'Catalog review request',
  subject: '{{companyName}}: How was {{itemName}}?',
  requiredKeys: [
    'userName',
    'companyName',
    'itemKind',
    'itemName',
    'reviewUrl',
    'sessionDate',
    'tokenLabel',
  ],
  html_body: `<p>Dear {{userName}},</p>
<p>Thank you for visiting <strong>{{companyName}}</strong>.</p>
<p>We would love your feedback on <strong>{{itemName}}</strong> ({{itemKind}}).</p>
<p><a href="{{reviewUrl}}">Leave or update your review</a></p>
<p>Session: {{sessionDate}}</p>
<p>Token: {{tokenLabel}}</p>
{{footerHtml}}`,
  text_body: `Dear {{userName}}

Thank you for visiting {{companyName}}.

We would love your feedback on {{itemName}} ({{itemKind}}).

Leave or update your review: {{reviewUrl}}

Session: {{sessionDate}}
Token: {{tokenLabel}}

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

  if (!row) {
    return
  }

  await knex('email_template_versions').where({ template_id: row.id }).del()
  await knex('email_templates').where({ id: row.id }).del()
}
