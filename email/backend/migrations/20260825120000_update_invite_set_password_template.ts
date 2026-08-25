import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const SLUG = 'invite_set_password'

const SUBJECT = 'Set the password for your Account'

const HTML_BODY = `<p>Hi {{userName}},</p>
<p>You have been added to <strong>{{companyName}}</strong> on WebOnOne.</p>
<p>Your account is ready. Open the link below, enter your email address, and follow the steps to receive a verification code and set your password.</p>
<p><a href="{{actionUrl}}">Set password</a></p>
<p>If you did not expect this invitation, you can ignore this email.</p>
{{footerHtml}}`

const TEXT_BODY = `Hi {{userName}},

You have been added to {{companyName}} on WebOnOne.

Your account is ready. Open the link below, enter your email address, and follow the steps to receive a verification code and set your password.

{{actionUrl}}

If you did not expect this invitation, you can ignore this email.

{{footerHtml}}`

export async function up(knex: Knex): Promise<void> {
  const row = await knex('email_templates')
    .where({ slug: SLUG, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (!row) {
    return
  }

  const now = knex.fn.now(3)

  await knex('email_templates').where({ id: row.id }).update({
    subject: SUBJECT,
    html_body: HTML_BODY,
    text_body: TEXT_BODY,
    updated_at: now,
  })

  const latestVersion = await knex('email_template_versions')
    .where({ template_id: row.id })
    .max('version_number as maxVersion')
    .first()

  const versionNumber = Number(latestVersion?.maxVersion ?? 0) + 1

  await knex('email_template_versions').insert({
    id: nanoid(),
    template_id: row.id,
    subject: SUBJECT,
    html_body: HTML_BODY,
    text_body: TEXT_BODY,
    version_number: versionNumber,
    created_by: null,
    created_at: now,
  })
}

export async function down(knex: Knex): Promise<void> {
  const row = await knex('email_templates')
    .where({ slug: SLUG, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (!row) {
    return
  }

  const previousVersion = await knex('email_template_versions')
    .where({ template_id: row.id })
    .orderBy('version_number', 'desc')
    .offset(1)
    .first()

  if (!previousVersion) {
    return
  }

  const now = knex.fn.now(3)

  await knex('email_templates').where({ id: row.id }).update({
    subject: previousVersion.subject,
    html_body: previousVersion.html_body,
    text_body: previousVersion.text_body,
    updated_at: now,
  })

  await knex('email_template_versions')
    .where({ template_id: row.id })
    .where('version_number', '>', previousVersion.version_number)
    .del()
}
