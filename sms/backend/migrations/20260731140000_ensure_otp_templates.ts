import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATES = [
  {
    slug: 'otp',
    name: 'OTP Code',
    body: 'Your WebOnOne code is {{code}}. It expires in {{minutes}} minutes.',
    requiredKeys: ['code', 'minutes'],
  },
  {
    slug: 'phone_verification',
    name: 'Phone Verification',
    body: 'Verify your number with code {{code}} on WebOnOne.',
    requiredKeys: ['code'],
  },
] as const

async function ensureTemplate(
  knex: Knex,
  template: (typeof TEMPLATES)[number],
): Promise<void> {
  const existing = await knex('sms_templates')
    .where({ slug: template.slug, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (existing) {
    return
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
    required_keys: JSON.stringify([...template.requiredKeys]),
    created_at: knex.fn.now(3),
    updated_at: knex.fn.now(3),
  })

  await knex('sms_template_versions').insert({
    id: nanoid(),
    template_id: id,
    body: template.body,
    version_number: 1,
    created_by: null,
    created_at: knex.fn.now(3),
  })
}

export async function up(knex: Knex): Promise<void> {
  for (const template of TEMPLATES) {
    await ensureTemplate(knex, template)
  }
}

export async function down(knex: Knex): Promise<void> {
  // Intentionally no-op: templates may have been created by earlier migrations.
}
