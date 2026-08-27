import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const TEMPLATE = {
  slug: 'sale_bill_completed',
  name: 'Sale Bill / Receipt',
  subject: 'Your receipt {{billNumber}} from {{companyName}}',
  requiredKeys: [
    'userName',
    'companyName',
    'billNumber',
    'billDate',
    'paymentMethod',
    'totalAmount',
    'linesHtml',
  ],
  html_body: `<p>Dear {{userName}},</p>
<p>Thank you for your purchase at <strong>{{companyName}}</strong>. Here is your receipt.</p>
<p>Bill number: <strong>{{billNumber}}</strong></p>
<p>Date: <strong>{{billDate}}</strong></p>
<p>Payment method: <strong>{{paymentMethod}}</strong></p>
{{linesHtml}}
<p style="margin-top: 16px;"><strong>Total: {{totalAmount}}</strong></p>
{{notes}}
<p>If you have any questions about this bill, please contact {{companyName}}.</p>
{{footerHtml}}`,
  text_body: `Dear {{userName}},

Thank you for your purchase at {{companyName}}. Here is your receipt.

Bill number: {{billNumber}}
Date: {{billDate}}
Payment method: {{paymentMethod}}

{{linesText}}

Total: {{totalAmount}}
{{notesText}}

If you have any questions about this bill, please contact {{companyName}}.

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
