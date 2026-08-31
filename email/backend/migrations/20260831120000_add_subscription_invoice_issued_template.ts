import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'subscription_invoice_issued',
  name: 'Subscription invoice issued',
  subject: 'Platform invoice {{invoiceNumber}} for {{companyName}}',
  requiredKeys: [
    'userName',
    'companyName',
    'invoiceNumber',
    'paymentReference',
    'billingPeriod',
    'amount',
    'dueDate',
    'invoicesUrl',
  ],
  html_body: `<p>Dear {{userName}},</p>
<p>A new platform subscription invoice has been issued for <strong>{{companyName}}</strong>.</p>
<p>Invoice number: <strong>{{invoiceNumber}}</strong></p>
<p>Billing period: <strong>{{billingPeriod}}</strong></p>
<p>Amount: <strong>{{amount}}</strong></p>
<p>Due date: <strong>{{dueDate}}</strong></p>
<p>Payment reference: <strong>{{paymentReference}}</strong></p>
<p><a href="{{invoicesUrl}}">View invoice</a></p>
<p>If you have questions about this invoice, please contact platform support.</p>
{{footerHtml}}`,
  text_body: `Dear {{userName}},

A new platform subscription invoice has been issued for {{companyName}}.

Invoice number: {{invoiceNumber}}
Billing period: {{billingPeriod}}
Amount: {{amount}}
Due date: {{dueDate}}
Payment reference: {{paymentReference}}

View invoice: {{invoicesUrl}}

If you have questions about this invoice, please contact platform support.

{{footerHtml}}`,
}

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
