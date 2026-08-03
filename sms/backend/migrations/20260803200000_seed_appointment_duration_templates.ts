import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATES = [
  {
    slug: 'appointment_booked',
    name: 'Appointment Booked',
    body: '{{companyName}}: your {{serviceName}} appointment is booked for {{appointmentDate}} at {{appointmentTime}} with {{staffName}} ({{durationMinutes}} min).',
    requiredKeys: [
      'userName',
      'companyName',
      'serviceName',
      'staffName',
      'appointmentDate',
      'appointmentTime',
      'durationMinutes',
    ],
  },
  {
    slug: 'appointment_reminder_24h',
    name: 'Appointment Reminder (24h)',
    body: '{{companyName}} reminder: {{serviceName}} tomorrow {{appointmentDate}} at {{appointmentTime}} with {{staffName}} ({{durationMinutes}} min).',
    requiredKeys: [
      'userName',
      'companyName',
      'serviceName',
      'staffName',
      'appointmentDate',
      'appointmentTime',
      'durationMinutes',
    ],
  },
] as const

/**
 * Seed platform SMS templates for duration-mode appointment booked + 24h reminder.
 */
export async function up(knex: Knex): Promise<void> {
  const now = knex.fn.now(3)

  for (const template of TEMPLATES) {
    const existing = await knex('sms_templates')
      .where({ slug: template.slug, scope: 'platform' })
      .whereNull('company_id')
      .first()

    if (existing) {
      continue
    }

    const id = nanoid()
    await knex('sms_templates').insert({
      id,
      slug: template.slug,
      name: template.name,
      body: template.body,
      scope: 'platform',
      company_id: null,
      is_active: true,
      required_keys: JSON.stringify(template.requiredKeys),
      created_at: now,
      updated_at: now,
    })

    await knex('sms_template_versions').insert({
      id: nanoid(),
      template_id: id,
      body: template.body,
      version_number: 1,
      created_by: null,
      created_at: now,
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const template of TEMPLATES) {
    const row = await knex('sms_templates')
      .where({ slug: template.slug, scope: 'platform' })
      .whereNull('company_id')
      .first()

    if (!row) continue

    await knex('sms_template_versions').where({ template_id: row.id }).del()
    await knex('sms_templates').where({ id: row.id }).del()
  }
}
