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

export async function listTemplates(filters: {
  companyId?: string | null
  scope?: TemplateScope
  role?: string
}): Promise<TemplateDto[]> {
  const query = db<EmailTemplateRow>('email_templates').orderBy('updated_at', 'desc')

  if (filters.scope) {
    query.where({ scope: filters.scope })
  }

  if (filters.role === 'company_admin' && filters.companyId) {
    query.where({ scope: 'company', company_id: filters.companyId })
  } else if (filters.role === 'super_admin') {
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
    return template.scope === 'company' && template.companyId === userCompanyId
  }
  return false
}
