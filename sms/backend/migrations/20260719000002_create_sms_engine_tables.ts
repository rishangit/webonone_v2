import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const PLATFORM_TEMPLATES = [
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
  {
    slug: 'password_reset',
    name: 'Password Reset',
    body: 'Your WebOnOne password reset code is {{code}}.',
    requiredKeys: ['code'],
  },
  {
    slug: 'generic',
    name: 'Generic Message',
    body: '{{body}}',
    requiredKeys: ['body'],
  },
] as const

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sms_devices', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable().defaultTo('')
    table.string('owner_user_id', 21).notNullable()
    table.enum('scope', ['platform', 'company']).notNullable().defaultTo('platform')
    table.string('company_id', 21).nullable().references('id').inTable('sms_companies').onDelete('CASCADE')
    table.string('device_key_hash', 64).notNullable()
    table.enum('status', ['pending', 'approved', 'revoked']).notNullable().defaultTo('pending')
    table.json('sim_slots').nullable()
    table.string('app_version', 32).nullable()
    table.datetime('last_seen_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['device_key_hash'])
    table.index(['scope', 'company_id'])
    table.index(['status'])
    table.index(['owner_user_id'])
  })

  await knex.schema.createTable('sms_templates', (table) => {
    table.string('id', 21).primary()
    table.string('slug', 64).notNullable()
    table.string('name', 255).notNullable()
    table.text('body').notNullable()
    table.enum('scope', ['platform', 'company']).notNullable().defaultTo('platform')
    table.string('company_id', 21).nullable().references('id').inTable('sms_companies').onDelete('CASCADE')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.json('required_keys').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['slug', 'scope', 'company_id'])
    table.index(['scope'])
    table.index(['company_id'])
    table.index(['is_active'])
  })

  await knex.schema.createTable('sms_template_versions', (table) => {
    table.string('id', 21).primary()
    table.string('template_id', 21).notNullable().references('id').inTable('sms_templates').onDelete('CASCADE')
    table.text('body').notNullable()
    table.integer('version_number').notNullable()
    table.string('created_by', 21).nullable().references('id').inTable('sms_users').onDelete('SET NULL')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['template_id'])
  })

  await knex.schema.createTable('sms_queue', (table) => {
    table.string('id', 21).primary()
    table.string('template_slug', 64).nullable()
    table.string('to_number', 32).notNullable()
    table.text('body').notNullable()
    table.json('payload_json').notNullable()
    table.string('company_id', 21).nullable().references('id').inTable('sms_companies').onDelete('SET NULL')
    table.enum('scope', ['platform', 'company']).notNullable().defaultTo('platform')
    table.enum('status', ['pending', 'processing', 'sent', 'failed']).notNullable().defaultTo('pending')
    table.string('assigned_device_id', 21).nullable()
    table.integer('sim_slot').nullable()
    table.integer('retry_count').notNullable().defaultTo(0)
    table.integer('max_retries').notNullable().defaultTo(3)
    table.integer('priority').notNullable().defaultTo(0)
    table.datetime('scheduled_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('dispatched_at', { precision: 3 }).nullable()
    table.datetime('processed_at', { precision: 3 }).nullable()
    table.text('last_error').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['status', 'scheduled_at'])
    table.index(['scope', 'company_id', 'status'])
    table.index(['assigned_device_id'])
  })

  await knex.schema.createTable('sms_history', (table) => {
    table.string('id', 21).primary()
    table.string('queue_id', 21).nullable().references('id').inTable('sms_queue').onDelete('SET NULL')
    table.string('to_number', 32).notNullable()
    table.enum('status', ['sent', 'failed']).notNullable()
    table.string('device_id', 21).nullable()
    table.integer('sim_slot').nullable()
    table.string('provider_message_ref', 255).nullable()
    table.string('template_slug', 64).nullable()
    table.string('company_id', 21).nullable().references('id').inTable('sms_companies').onDelete('SET NULL')
    table.text('error_message').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id'])
    table.index(['status'])
    table.index(['created_at'])
  })

  await knex.schema.createTable('sms_otps', (table) => {
    table.string('id', 21).primary()
    table.string('phone_number', 32).notNullable()
    table.string('otp_hash', 64).notNullable()
    table.string('purpose', 64).notNullable()
    table.string('company_id', 21).nullable().references('id').inTable('sms_companies').onDelete('SET NULL')
    table.datetime('expires_at', { precision: 3 }).notNullable()
    table.datetime('used_at', { precision: 3 }).nullable()
    table.integer('attempt_count').notNullable().defaultTo(0)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['phone_number', 'purpose'])
    table.index(['expires_at'])
  })

  await knex.schema.createTable('sms_audit_log', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).nullable().references('id').inTable('sms_users').onDelete('SET NULL')
    table.string('action', 64).notNullable()
    table.string('entity_type', 64).notNullable()
    table.string('entity_id', 21).nullable()
    table.json('metadata_json').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['user_id'])
    table.index(['entity_type', 'entity_id'])
    table.index(['created_at'])
  })

  const now = knex.fn.now(3)
  for (const template of PLATFORM_TEMPLATES) {
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
  await knex.schema.dropTableIfExists('sms_audit_log')
  await knex.schema.dropTableIfExists('sms_otps')
  await knex.schema.dropTableIfExists('sms_history')
  await knex.schema.dropTableIfExists('sms_queue')
  await knex.schema.dropTableIfExists('sms_template_versions')
  await knex.schema.dropTableIfExists('sms_templates')
  await knex.schema.dropTableIfExists('sms_devices')
}
