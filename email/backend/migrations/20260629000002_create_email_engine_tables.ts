import type { Knex } from 'knex'
import { nanoid } from 'nanoid'

const PLATFORM_TEMPLATES = [
  {
    slug: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your password',
    requiredKeys: ['userName', 'actionUrl'],
    html_body: `<p>Hi {{userName}},</p>
<p>We received a request to reset your password. Click the link below to choose a new password. This link expires in 1 hour.</p>
<p><a href="{{actionUrl}}">Reset password</a></p>
<p>If you did not request this, you can ignore this email.</p>
{{footerHtml}}`,
    text_body: `Hi {{userName}},

We received a request to reset your password. Visit the link below to choose a new password. This link expires in 1 hour.

{{actionUrl}}

If you did not request this, you can ignore this email.

{{footerHtml}}`,
  },
  {
    slug: 'email_verification',
    name: 'Email Verification',
    subject: 'Verify your email address',
    requiredKeys: ['userName', 'actionUrl'],
    html_body: `<p>Hi {{userName}},</p>
<p>Please verify your email address by clicking the link below. This link expires in 24 hours.</p>
<p><a href="{{actionUrl}}">Verify email</a></p>
{{footerHtml}}`,
    text_body: `Hi {{userName}},

Please verify your email address by visiting the link below. This link expires in 24 hours.

{{actionUrl}}

{{footerHtml}}`,
  },
  {
    slug: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to WebOnOne',
    requiredKeys: ['userName'],
    html_body: `<p>Hi {{userName}},</p>
<p>Welcome to WebOnOne! Your account is ready.</p>
{{footerHtml}}`,
    text_body: `Hi {{userName}},

Welcome to WebOnOne! Your account is ready.

{{footerHtml}}`,
  },
  {
    slug: 'company_registered',
    name: 'Company Registration Submitted',
    subject: 'Company registration received: {{companyName}}',
    requiredKeys: ['companyName', 'userName'],
    html_body: `<p>Hi {{userName}},</p>
<p>We received your company registration for <strong>{{companyName}}</strong>. Our team will review it shortly.</p>
{{footerHtml}}`,
    text_body: `Hi {{userName}},

We received your company registration for {{companyName}}. Our team will review it shortly.

{{footerHtml}}`,
  },
  {
    slug: 'company_approved',
    name: 'Company Approved',
    subject: 'Your company was approved: {{companyName}}',
    requiredKeys: ['companyName', 'userName'],
    html_body: `<p>Hi {{userName}},</p>
<p>Great news! Your company <strong>{{companyName}}</strong> has been approved.</p>
{{footerHtml}}`,
    text_body: `Hi {{userName}},

Great news! Your company {{companyName}} has been approved.

{{footerHtml}}`,
  },
  {
    slug: 'company_rejected',
    name: 'Company Rejected',
    subject: 'Company registration update: {{companyName}}',
    requiredKeys: ['companyName', 'userName'],
    html_body: `<p>Hi {{userName}},</p>
<p>Your company registration for <strong>{{companyName}}</strong> was not approved at this time.</p>
<p>{{message}}</p>
{{footerHtml}}`,
    text_body: `Hi {{userName}},

Your company registration for {{companyName}} was not approved at this time.

{{message}}

{{footerHtml}}`,
  },
] as const

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_templates', (table) => {
    table.string('id', 21).primary()
    table.string('slug', 64).notNullable()
    table.string('name', 255).notNullable()
    table.string('subject', 512).notNullable()
    table.text('html_body').notNullable()
    table.text('text_body').notNullable()
    table.enum('scope', ['platform', 'company']).notNullable().defaultTo('platform')
    table.string('company_id', 21).nullable().references('id').inTable('email_companies').onDelete('CASCADE')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.json('required_keys').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['slug', 'scope', 'company_id'])
    table.index(['scope'])
    table.index(['company_id'])
    table.index(['is_active'])
  })

  await knex.schema.createTable('email_template_versions', (table) => {
    table.string('id', 21).primary()
    table.string('template_id', 21).notNullable().references('id').inTable('email_templates').onDelete('CASCADE')
    table.string('subject', 512).notNullable()
    table.text('html_body').notNullable()
    table.text('text_body').notNullable()
    table.integer('version_number').notNullable()
    table.string('created_by', 21).nullable().references('id').inTable('email_users').onDelete('SET NULL')
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['template_id'])
  })

  await knex.schema.createTable('email_company_branding', (table) => {
    table.string('company_id', 21).primary().references('id').inTable('email_companies').onDelete('CASCADE')
    table.string('name', 255).notNullable().defaultTo('')
    table.string('logo_url', 2048).nullable()
    table.string('primary_color', 32).nullable()
    table.string('contact_email', 255).nullable()
    table.text('footer_html').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  await knex.schema.createTable('email_providers', (table) => {
    table.string('id', 21).primary()
    table.string('name', 255).notNullable().defaultTo('default')
    table.string('host', 255).notNullable()
    table.integer('port').notNullable().defaultTo(587)
    table.boolean('secure').notNullable().defaultTo(false)
    table.string('from_address', 255).notNullable()
    table.string('from_name', 255).notNullable().defaultTo('WebOnOne')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })

  await knex.schema.createTable('email_queue', (table) => {
    table.string('id', 21).primary()
    table.string('template_slug', 64).notNullable()
    table.string('to_email', 255).notNullable()
    table.json('payload_json').notNullable()
    table.string('company_id', 21).nullable().references('id').inTable('email_companies').onDelete('SET NULL')
    table.enum('status', ['pending', 'processing', 'sent', 'failed']).notNullable().defaultTo('pending')
    table.integer('retry_count').notNullable().defaultTo(0)
    table.integer('max_retries').notNullable().defaultTo(3)
    table.integer('priority').notNullable().defaultTo(0)
    table.datetime('scheduled_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('processed_at', { precision: 3 }).nullable()
    table.text('last_error').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['status', 'scheduled_at'])
    table.index(['company_id'])
    table.index(['template_slug'])
  })

  await knex.schema.createTable('email_history', (table) => {
    table.string('id', 21).primary()
    table.string('queue_id', 21).nullable().references('id').inTable('email_queue').onDelete('SET NULL')
    table.enum('status', ['sent', 'failed']).notNullable()
    table.string('provider_message_id', 255).nullable()
    table.datetime('sent_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.string('recipient', 255).notNullable()
    table.string('template_slug', 64).notNullable()
    table.string('company_id', 21).nullable().references('id').inTable('email_companies').onDelete('SET NULL')
    table.text('error_message').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['company_id'])
    table.index(['template_slug'])
    table.index(['status'])
    table.index(['sent_at'])
  })

  await knex.schema.createTable('email_audit_log', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).nullable().references('id').inTable('email_users').onDelete('SET NULL')
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

  await knex('email_providers').insert({
    id: nanoid(),
    name: 'default',
    host: 'localhost',
    port: 587,
    secure: false,
    from_address: 'noreply@example.com',
    from_name: 'WebOnOne',
    is_active: true,
    created_at: now,
    updated_at: now,
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_audit_log')
  await knex.schema.dropTableIfExists('email_history')
  await knex.schema.dropTableIfExists('email_queue')
  await knex.schema.dropTableIfExists('email_providers')
  await knex.schema.dropTableIfExists('email_company_branding')
  await knex.schema.dropTableIfExists('email_template_versions')
  await knex.schema.dropTableIfExists('email_templates')
}
