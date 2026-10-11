import type { Knex } from 'knex'
import { nanoid } from 'nanoid'
import { injectSmsWebOnOneLink, mergeRequiredKey } from '../src/utils/templateWebOnOneLink.js'

type SmsTemplateRow = {
  id: string
  body: string
  required_keys: string | string[] | null
}

export async function up(knex: Knex): Promise<void> {
  const rows = await knex<SmsTemplateRow>('sms_templates').select('id', 'body', 'required_keys')
  const now = knex.fn.now(3)

  for (const row of rows) {
    if (row.body.includes('{{webOnOneUrl}}')) {
      continue
    }

    const body = injectSmsWebOnOneLink(row.body)
    const requiredKeys = mergeRequiredKey(row.required_keys, 'webOnOneUrl')

    await knex('sms_templates').where({ id: row.id }).update({
      body,
      required_keys: JSON.stringify(requiredKeys),
      updated_at: now,
    })

    const latestVersion = await knex('sms_template_versions')
      .where({ template_id: row.id })
      .max('version_number as maxVersion')
      .first()

    const versionNumber = Number(latestVersion?.maxVersion ?? 0) + 1

    await knex('sms_template_versions').insert({
      id: nanoid(),
      template_id: row.id,
      body,
      version_number: versionNumber,
      created_by: null,
      created_at: now,
    })
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Irreversible — company overrides may have been edited after migration.
}
