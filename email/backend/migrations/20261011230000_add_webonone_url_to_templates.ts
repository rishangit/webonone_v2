import type { Knex } from 'knex'
import { nanoid } from 'nanoid'
import {
  injectEmailWebOnOneLink,
  mergeRequiredKey,
} from '../src/utils/templateWebOnOneLink.js'

type EmailTemplateRow = {
  id: string
  html_body: string
  text_body: string
  required_keys: string | string[] | null
  subject: string
}

export async function up(knex: Knex): Promise<void> {
  const rows = await knex<EmailTemplateRow>('email_templates').select(
    'id',
    'html_body',
    'text_body',
    'required_keys',
    'subject',
  )

  const now = knex.fn.now(3)

  for (const row of rows) {
    if (row.html_body.includes('{{webOnOneUrl}}')) {
      continue
    }

    const { htmlBody, textBody } = injectEmailWebOnOneLink(row.html_body, row.text_body)
    const requiredKeys = mergeRequiredKey(row.required_keys, 'webOnOneUrl')

    await knex('email_templates').where({ id: row.id }).update({
      html_body: htmlBody,
      text_body: textBody,
      required_keys: JSON.stringify(requiredKeys),
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
      html_body: htmlBody,
      text_body: textBody,
      version_number: versionNumber,
      created_by: null,
      created_at: now,
    })
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Irreversible — company overrides may have been edited after migration.
}
