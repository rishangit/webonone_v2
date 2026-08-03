import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATES = [
  {
    slug: 'appointment_booked',
    name: 'Appointment Booked',
    subject: 'Appointment confirmed: {{serviceName}} on {{appointmentDate}}',
    requiredKeys: [
      'userName',
      'companyName',
      'serviceName',
      'staffName',
      'appointmentDate',
      'appointmentTime',
      'durationMinutes',
    ],
    html_body: `<p>Dear {{userName}},</p>
<p>Your appointment for <strong>{{serviceName}}</strong> at {{companyName}} has been booked.</p>
<p>Date: <strong>{{appointmentDate}}</strong></p>
<p>Time: <strong>{{appointmentTime}}</strong> ({{durationMinutes}} minutes)</p>
<p>With: {{staffName}}</p>
<p>We look forward to seeing you.</p>
{{footerHtml}}`,
    text_body: `Dear {{userName}}

Your appointment for {{serviceName}} at {{companyName}} has been booked.

Date: {{appointmentDate}}
Time: {{appointmentTime}} ({{durationMinutes}} minutes)
With: {{staffName}}

We look forward to seeing you.

{{footerHtml}}`,
  },
  {
    slug: 'appointment_reminder_24h',
    name: 'Appointment Reminder (24h)',
    subject: 'Reminder: {{serviceName}} tomorrow at {{appointmentTime}}',
    requiredKeys: [
      'userName',
      'companyName',
      'serviceName',
      'staffName',
      'appointmentDate',
      'appointmentTime',
      'durationMinutes',
    ],
    html_body: `<p>Dear {{userName}},</p>
<p>This is a reminder that your appointment for <strong>{{serviceName}}</strong> at {{companyName}} is in 24 hours.</p>
<p>Date: <strong>{{appointmentDate}}</strong></p>
<p>Time: <strong>{{appointmentTime}}</strong> ({{durationMinutes}} minutes)</p>
<p>With: {{staffName}}</p>
<p>Please arrive a few minutes early.</p>
{{footerHtml}}`,
    text_body: `Dear {{userName}}

This is a reminder that your appointment for {{serviceName}} at {{companyName}} is in 24 hours.

Date: {{appointmentDate}}
Time: {{appointmentTime}} ({{durationMinutes}} minutes)
With: {{staffName}}

Please arrive a few minutes early.

{{footerHtml}}`,
  },
] as const

export async function up(knex: Knex): Promise<void> {
  const now = knex.fn.now(3)

  for (const template of TEMPLATES) {
    const existing = await knex('email_templates')
      .where({ slug: template.slug, scope: 'platform' })
      .whereNull('company_id')
      .first()

    if (existing) {
      continue
    }

    const id = nanoid()
    await knex('email_templates').insert({
      id,
      slug: template.slug,
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body,
      scope: 'platform',
      company_id: null,
      is_active: true,
      required_keys: JSON.stringify(template.requiredKeys),
      created_at: now,
      updated_at: now,
    })

    await knex('email_template_versions').insert({
      id: nanoid(),
      template_id: id,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body,
      version_number: 1,
      created_by: null,
      created_at: now,
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const template of TEMPLATES) {
    const row = await knex('email_templates')
      .where({ slug: template.slug, scope: 'platform' })
      .whereNull('company_id')
      .first()

    if (!row) {
      continue
    }

    await knex('email_template_versions').where({ template_id: row.id }).del()
    await knex('email_templates').where({ id: row.id }).del()
  }
}
