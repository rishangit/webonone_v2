import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import { db } from '../models/db.js'
import type { EmailTemplateRow, EmailTemplateVersionRow, TemplateScope } from '../models/db.js'
import { htmlToText } from '../utils/htmlToText.js'
import { findMissingPlaceholders, renderPlaceholders } from '../utils/renderPlaceholders.js'
import { brandingToPlaceholders, getBranding } from './branding.service.js'

export interface TemplateDto {
  id: string
  slug: string
  name: string
  subject: string
  htmlBody: string
  textBody: string
  scope: TemplateScope
  companyId: string | null
  isActive: boolean
  requiredKeys: string[]
  createdAt: string
  updatedAt: string
  /** Platform template shown to company admins until they save a company override. */
  isDefault?: boolean
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

function parseRequiredKeys(row: EmailTemplateRow): string[] {
  if (!row.required_keys) return []
  if (Array.isArray(row.required_keys)) return row.required_keys
  try {
    const parsed = JSON.parse(row.required_keys) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function rowToDto(row: EmailTemplateRow): TemplateDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subject: row.subject,
    htmlBody: row.html_body,
    textBody: row.text_body,
    scope: row.scope,
    companyId: row.company_id,
    isActive: row.is_active,
    requiredKeys: parseRequiredKeys(row),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function resolveTemplate(slug: string, companyId?: string | null): Promise<EmailTemplateRow | null> {
  if (companyId) {
    const companyTemplate = await db<EmailTemplateRow>('email_templates')
      .where({ slug, scope: 'company', company_id: companyId, is_active: true })
      .first()
    if (companyTemplate) return companyTemplate
  }

  const platformTemplate = await db<EmailTemplateRow>('email_templates')
    .where({ slug, scope: 'platform', is_active: true })
    .whereNull('company_id')
    .first()

  return platformTemplate ?? null
}

/** Platform slugs company owners may see/customize as defaults (1.13.6). */
const COMPANY_DEFAULT_PLATFORM_SLUGS = new Set(['welcome'])

export async function listTemplates(filters: {
  companyId?: string | null
  scope?: TemplateScope
  role?: string
}): Promise<TemplateDto[]> {
  if (filters.role === 'company_admin' && filters.companyId) {
    const companyRows = await db<EmailTemplateRow>('email_templates')
      .where({ scope: 'company', company_id: filters.companyId })
      .orderBy('updated_at', 'desc')

    const platformRows = await db<EmailTemplateRow>('email_templates')
      .where({ scope: 'platform', is_active: true })
      .whereNull('company_id')
      .whereIn('slug', [...COMPANY_DEFAULT_PLATFORM_SLUGS])
      .orderBy('updated_at', 'desc')

    const overriddenSlugs = new Set(companyRows.map((row) => row.slug))
    const defaults = platformRows
      .filter((row) => !overriddenSlugs.has(row.slug))
      .map((row) => ({ ...rowToDto(row), isDefault: true }))

    return [...companyRows.map(rowToDto), ...defaults]
  }

  const query = db<EmailTemplateRow>('email_templates').orderBy('updated_at', 'desc')

  if (filters.scope) {
    query.where({ scope: filters.scope })
  }

  if (filters.role === 'super_admin') {
    query.where({ scope: 'platform' }).whereNull('company_id')
  } else if (filters.companyId) {
    query.where({ scope: 'company', company_id: filters.companyId })
  } else {
    query.where({ scope: 'platform' }).whereNull('company_id')
  }

  const rows = await query
  return rows.map(rowToDto)
}

export async function getTemplateById(id: string): Promise<TemplateDto | null> {
  const row = await db<EmailTemplateRow>('email_templates').where({ id }).first()
  return row ? rowToDto(row) : null
}

export async function createTemplate(
  input: {
    slug: string
    name: string
    subject: string
    htmlBody: string
    textBody: string
    scope: TemplateScope
    companyId: string | null
    requiredKeys?: string[]
    isActive?: boolean
  },
  userId?: string,
): Promise<TemplateDto> {
  const existing = await db<EmailTemplateRow>('email_templates')
    .where({ slug: input.slug, scope: input.scope })
    .modify((qb) => {
      if (input.companyId) qb.where({ company_id: input.companyId })
      else qb.whereNull('company_id')
    })
    .first()
  if (existing) {
    throw new Error(`A template with slug "${input.slug}" already exists in this scope`)
  }

  const id = nanoid()
  await db('email_templates').insert({
    id,
    slug: input.slug,
    name: input.name,
    subject: input.subject,
    html_body: input.htmlBody,
    text_body: input.textBody,
    scope: input.scope,
    company_id: input.companyId,
    is_active: input.isActive ?? true,
    required_keys: JSON.stringify(input.requiredKeys ?? []),
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })

  await db('email_template_versions').insert({
    id: nanoid(),
    template_id: id,
    subject: input.subject,
    html_body: input.htmlBody,
    text_body: input.textBody,
    version_number: 1,
    created_by: userId ?? null,
    created_at: db.fn.now(3),
  })

  const created = await db<EmailTemplateRow>('email_templates').where({ id }).first()
  return rowToDto(created!)
}

export async function validateTemplatePayload(
  template: EmailTemplateRow,
  payload: Record<string, string>,
  companyId?: string | null,
): Promise<void> {
  const requiredKeys = parseRequiredKeys(template)
  const branding = companyId ? await getBranding(companyId) : null
  const extras = {
    ...brandingToPlaceholders(branding),
    year: String(new Date().getFullYear()),
  }

  const content = `${template.subject}\n${template.html_body}\n${template.text_body}`
  const missing = findMissingPlaceholders(content, requiredKeys, payload, extras)
  if (missing.length > 0) {
    throw new Error(`Missing required template placeholders: ${missing.join(', ')}`)
  }
}

export async function renderEmail(
  template: EmailTemplateRow,
  payload: Record<string, string>,
  companyId?: string | null,
): Promise<RenderedEmail> {
  const branding = companyId ? await getBranding(companyId) : null
  const extras = {
    ...brandingToPlaceholders(branding),
    year: String(new Date().getFullYear()),
  }

  const subject = renderPlaceholders(template.subject, payload, extras)
  const html = renderPlaceholders(template.html_body, payload, extras)
  const text = template.text_body.trim()
    ? renderPlaceholders(template.text_body, payload, extras)
    : htmlToText(html)

  return { subject, html, text }
}

export async function updateTemplate(
  id: string,
  input: {
    name?: string
    subject?: string
    htmlBody?: string
    textBody?: string
    isActive?: boolean
  },
  userId?: string,
): Promise<TemplateDto> {
  const existing = await db<EmailTemplateRow>('email_templates').where({ id }).first()
  if (!existing) {
    throw new Error('Template not found')
  }

  const patch: Partial<EmailTemplateRow> = {
    updated_at: new Date(),
  }
  if (input.name !== undefined) patch.name = input.name
  if (input.subject !== undefined) patch.subject = input.subject
  if (input.htmlBody !== undefined) patch.html_body = input.htmlBody
  if (input.textBody !== undefined) patch.text_body = input.textBody
  if (input.isActive !== undefined) patch.is_active = input.isActive

  await db('email_templates').where({ id }).update({
    ...patch,
    updated_at: db.fn.now(3),
  })

  const updated = await db<EmailTemplateRow>('email_templates').where({ id }).first()
  const latestVersion = await db<EmailTemplateVersionRow>('email_template_versions')
    .where({ template_id: id })
    .orderBy('version_number', 'desc')
    .first()

  await db('email_template_versions').insert({
    id: nanoid(),
    template_id: id,
    subject: updated!.subject,
    html_body: updated!.html_body,
    text_body: updated!.text_body,
    version_number: (latestVersion?.version_number ?? 0) + 1,
    created_by: userId ?? null,
    created_at: db.fn.now(3),
  })

  return rowToDto(updated!)
}

export async function listTemplateVersions(templateId: string) {
  const rows = await db<EmailTemplateVersionRow>('email_template_versions')
    .where({ template_id: templateId })
    .orderBy('version_number', 'desc')

  return rows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    subject: row.subject,
    htmlBody: row.html_body,
    textBody: row.text_body,
    versionNumber: row.version_number,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function restoreTemplateVersion(
  templateId: string,
  versionId: string,
  userId?: string,
): Promise<TemplateDto> {
  const version = await db<EmailTemplateVersionRow>('email_template_versions')
    .where({ id: versionId, template_id: templateId })
    .first()
  if (!version) {
    throw new Error('Template version not found')
  }

  return updateTemplate(
    templateId,
    {
      subject: version.subject,
      htmlBody: version.html_body,
      textBody: version.text_body,
    },
    userId,
  )
}

export async function previewTemplate(
  templateId: string,
  payload: Record<string, string>,
  companyId?: string | null,
): Promise<RenderedEmail> {
  const row = await db<EmailTemplateRow>('email_templates').where({ id: templateId }).first()
  if (!row) {
    throw new Error('Template not found')
  }

  const samplePayload = {
    userName: 'Sample User',
    companyName: 'Sample Company',
    actionUrl: `${env.frontendBaseUrl}/example`,
    otp: '1234',
    message: 'Sample reviewer message',
    ...payload,
  }

  return renderEmail(row, samplePayload, companyId ?? row.company_id)
}

export function canAccessTemplate(
  template: TemplateDto,
  role: string,
  userCompanyId: string | null,
): boolean {
  if (role === 'super_admin') return true
  if (role === 'company_admin') {
    if (template.scope === 'company' && template.companyId === userCompanyId) return true
    // Company owners may view only allowed platform defaults (e.g. welcome).
    if (
      template.scope === 'platform' &&
      !template.companyId &&
      COMPANY_DEFAULT_PLATFORM_SLUGS.has(template.slug)
    ) {
      return true
    }
    return false
  }
  return false
}

/** Create a company override from a platform template (first company edit of a default). */
export async function createCompanyOverrideFromPlatform(
  platformTemplateId: string,
  companyId: string,
  input: {
    name?: string
    subject?: string
    htmlBody?: string
    textBody?: string
    requiredKeys?: string[]
    isActive?: boolean
  },
  userId?: string,
): Promise<TemplateDto> {
  await ensureEmailCompany(companyId)

  const platform = await db<EmailTemplateRow>('email_templates').where({ id: platformTemplateId }).first()
  if (!platform || platform.scope !== 'platform') {
    throw new Error('Platform template not found')
  }

  const existing = await db<EmailTemplateRow>('email_templates')
    .where({ slug: platform.slug, scope: 'company', company_id: companyId })
    .first()
  if (existing) {
    return updateTemplate(existing.id, input, userId)
  }

  return createTemplate(
    {
      slug: platform.slug,
      name: input.name ?? platform.name,
      subject: input.subject ?? platform.subject,
      htmlBody: input.htmlBody ?? platform.html_body,
      textBody: input.textBody ?? platform.text_body,
      scope: 'company',
      companyId,
      requiredKeys: input.requiredKeys ?? parseRequiredKeys(platform),
      isActive: input.isActive ?? platform.is_active,
    },
    userId,
  )
}

async function ensureEmailCompany(companyId: string, name?: string): Promise<void> {
  const existing = await db('email_companies').where({ id: companyId }).first()
  if (existing) return

  try {
    await db('email_companies').insert({
      id: companyId,
      name: name?.trim() || companyId,
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
  } catch (err) {
    const again = await db('email_companies').where({ id: companyId }).first()
    if (again) return
    throw err
  }
}

/** Upsert local company copy so FK inserts (queue, company templates) succeed. */
export async function ensureLocalCompany(companyId: string, name?: string): Promise<void> {
  await ensureEmailCompany(companyId, name)
}

const DEFAULT_WELCOME = {
  name: 'Welcome',
  subject: 'Welcome to {{companyName}}',
  htmlBody: `<p>Hi {{userName}},</p>
<p>Welcome to <strong>{{companyName}}</strong>!</p>
{{footerHtml}}`,
  textBody: `Hi {{userName}},

Welcome to {{companyName}}!

{{footerHtml}}`,
  requiredKeys: ['userName', 'companyName'],
}

export async function ensureWelcomeTemplate(
  companyId: string,
  companyName?: string,
): Promise<{ status: 'created' | 'exists'; templateId: string }> {
  await ensureEmailCompany(companyId, companyName)

  const existing = await db<EmailTemplateRow>('email_templates')
    .where({ slug: 'welcome', scope: 'company', company_id: companyId })
    .first()

  if (existing) {
    return { status: 'exists', templateId: existing.id }
  }

  const platform = await db<EmailTemplateRow>('email_templates')
    .where({ slug: 'welcome', scope: 'platform' })
    .whereNull('company_id')
    .first()

  const created = await createTemplate({
    slug: 'welcome',
    name: platform?.name ?? DEFAULT_WELCOME.name,
    subject: platform?.subject?.includes('{{companyName}}')
      ? platform.subject
      : DEFAULT_WELCOME.subject,
    htmlBody: platform?.html_body?.includes('{{companyName}}')
      ? platform.html_body
      : DEFAULT_WELCOME.htmlBody,
    textBody: platform?.text_body?.includes('{{companyName}}')
      ? platform.text_body
      : DEFAULT_WELCOME.textBody,
    scope: 'company',
    companyId,
    requiredKeys: platform
      ? Array.from(new Set([...parseRequiredKeys(platform), 'companyName']))
      : [...DEFAULT_WELCOME.requiredKeys],
    isActive: true,
  })

  return { status: 'created', templateId: created.id }
}
