import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'invite_set_password',
  name: 'Invite set password',
  subject: 'Set the password for your Account',
  requiredKeys: ['userName', 'companyName', 'actionUrl'],
  html_body: `<p>Hi {{userName}},</p>
<p>You have been added to <strong>{{companyName}}</strong> on WebOnOne.</p>
<p>Your account is ready. Open the link below, enter your email address, and follow the steps to receive a verification code and set your password.</p>
<p><a href="{{actionUrl}}">Set password</a></p>
<p>If you did not expect this invitation, you can ignore this email.</p>
{{footerHtml}}`,
  text_body: `Hi {{userName}},

You have been added to {{companyName}} on WebOnOne.

Your account is ready. Open the link below, enter your email address, and follow the steps to receive a verification code and set your password.

{{actionUrl}}

If you did not expect this invitation, you can ignore this email.

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
