import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'subscription_invoice_issued',
  name: 'Subscription invoice issued',
  body: '{{companyName}}: Invoice {{invoiceNumber}} for {{billingPeriod}} — {{amount}} due {{dueDate}}. Ref {{paymentReference}}. {{invoicesUrl}}',
  requiredKeys: [
    'companyName',
    'invoiceNumber',
    'billingPeriod',
    'amount',
    'dueDate',
    'paymentReference',
    'invoicesUrl',
  ],
}

export async function up(knex: Knex): Promise<void> {
  const existing = await knex('sms_templates')
    .where({ slug: TEMPLATE.slug, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (existing) {
    return
  }

  const now = knex.fn.now(3)
  const id = nanoid()

  await knex('sms_templates').insert({
    id,
    slug: TEMPLATE.slug,
    name: TEMPLATE.name,
    body: TEMPLATE.body,
    scope: 'platform',
    company_id: null,
    is_active: true,
    required_keys: JSON.stringify(TEMPLATE.requiredKeys),
    created_at: now,
    updated_at: now,
  })

  await knex('sms_template_versions').insert({
    id: nanoid(),
    template_id: id,
    body: TEMPLATE.body,
    version_number: 1,
    created_by: null,
    created_at: now,
  })
}

export async function down(knex: Knex): Promise<void> {
  const row = await knex('sms_templates')
    .where({ slug: TEMPLATE.slug, scope: 'platform' })
    .whereNull('company_id')
    .first()

  if (!row) {
    return
  }

  await knex('sms_template_versions').where({ template_id: row.id }).del()
  await knex('sms_templates').where({ id: row.id }).del()
}
