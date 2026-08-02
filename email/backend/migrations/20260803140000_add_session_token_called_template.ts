import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'session_token_called',
  name: 'Session Token Called',
  subject: '{{companyName}}: your token {{tokenLabel}} is now being served',
  requiredKeys: [
    'userName',
    'companyName',
    'serviceName',
    'tokenLabel',
    'sessionDate',
    'sessionTime',
  ],
  html_body: `<p>Dear {{userName}},</p>
<p>Your queue token for <strong>{{serviceName}}</strong> at {{companyName}} is now being served.</p>
<p>Token: <strong>{{tokenLabel}}</strong></p>
<p>Session: {{sessionDate}} at {{sessionTime}}</p>
<p>Please proceed to the service point now.</p>
{{footerHtml}}`,
  text_body: `Dear {{userName}}

Your queue token for {{serviceName}} at {{companyName}} is now being served.

Token: {{tokenLabel}}
Session: {{sessionDate}} at {{sessionTime}}

Please proceed to the service point now.

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
