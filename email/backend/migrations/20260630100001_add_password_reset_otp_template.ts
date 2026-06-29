import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'password_reset_otp',
  name: 'Password Reset OTP',
  subject: 'Your password reset code',
  requiredKeys: ['userName', 'otp'],
  html_body: `<p>Dear {{userName}},</p>
<p>We received a request to reset your password.</p>
<p>Your verification code is: <strong>{{otp}}</strong></p>
<p>This code expires in 1 minute. If you did not request this, ignore this email.</p>
{{footerHtml}}`,
  text_body: `Dear {{userName}}

We received a request to reset your password.

Your verification code is: {{otp}}

This code expires in 1 minute. If you did not request this, ignore this email.

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
