import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const SLUG = 'sale_bill_completed'

const HTML_BODY = `<p>Dear {{userName}},</p>
<p>Thank you for your purchase at <strong>{{companyName}}</strong>. Here is your receipt.</p>
<p>Bill number: <strong>{{billNumber}}</strong></p>
<p>Date: <strong>{{billDate}}</strong></p>
<p>Payment method: <strong>{{paymentMethod}}</strong></p>
{{linesHtml}}
<p style="margin-top: 16px;"><strong>Total: {{totalAmount}}</strong></p>
{{recommendedHtml}}
{{notes}}
<p>If you have any questions about this bill, please contact {{companyName}}.</p>
{{footerHtml}}`

const TEXT_BODY = `Dear {{userName}},

Thank you for your purchase at {{companyName}}. Here is your receipt.

Bill number: {{billNumber}}
Date: {{billDate}}
Payment method: {{paymentMethod}}

{{linesText}}

Total: {{totalAmount}}
{{recommendedText}}
{{notesText}}

If you have any questions about this bill, please contact {{companyName}}.

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
    subject: row.subject,
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
    html_body: previousVersion.html_body,
    text_body: previousVersion.text_body,
    updated_at: now,
  })

  await knex('email_template_versions')
    .where({ template_id: row.id })
    .where('version_number', '>', previousVersion.version_number)
    .del()
}
