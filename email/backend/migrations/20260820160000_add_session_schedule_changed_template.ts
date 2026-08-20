import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'session_schedule_changed',
  name: 'Session Schedule Changed',
  subject: '{{companyName}}: {{serviceName}} session time updated',
  requiredKeys: [
    'userName',
    'companyName',
    'serviceName',
    'sessionDate',
    'previousSessionTime',
    'sessionTime',
    'sessionEndTime',
    'location',
    'tokenLabel',
  ],
  html_body: `<p>Dear {{userName}},</p>
<p>The schedule for <strong>{{serviceName}}</strong> at {{companyName}} has changed.</p>
<p><strong>Date:</strong> {{sessionDate}}<br/>
<strong>Previous time:</strong> {{previousSessionTime}}<br/>
<strong>New time:</strong> {{sessionTime}}–{{sessionEndTime}}<br/>
<strong>Location:</strong> {{location}}</p>
<p>Your token: <strong>{{tokenLabel}}</strong></p>
<p>Please arrive according to the new time.</p>
{{footerHtml}}`,
  text_body: `Dear {{userName}}

The schedule for {{serviceName}} at {{companyName}} has changed.

Date: {{sessionDate}}
Previous time: {{previousSessionTime}}
New time: {{sessionTime}}–{{sessionEndTime}}
Location: {{location}}

Your token: {{tokenLabel}}

Please arrive according to the new time.

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
