import { db } from '../models/db.js'
import type { EmailCompanyBrandingRow } from '../models/db.js'

export interface BrandingDto {
  companyId: string
  name: string
  logoUrl: string | null
  primaryColor: string | null
  contactEmail: string | null
  footerHtml: string | null
}

function rowToDto(row: EmailCompanyBrandingRow): BrandingDto {
  return {
    companyId: row.company_id,
    name: row.name,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    contactEmail: row.contact_email,
    footerHtml: row.footer_html,
  }
}

export async function getBranding(companyId: string): Promise<BrandingDto | null> {
  const row = await db<EmailCompanyBrandingRow>('email_company_branding').where({ company_id: companyId }).first()
  return row ? rowToDto(row) : null
}

export async function upsertBranding(
  companyId: string,
  input: Partial<Omit<BrandingDto, 'companyId'>>,
): Promise<BrandingDto> {
  const existing = await db<EmailCompanyBrandingRow>('email_company_branding').where({ company_id: companyId }).first()

  const patch = {
    name: input.name ?? existing?.name ?? '',
    logo_url: input.logoUrl !== undefined ? input.logoUrl : (existing?.logo_url ?? null),
    primary_color: input.primaryColor !== undefined ? input.primaryColor : (existing?.primary_color ?? null),
    contact_email: input.contactEmail !== undefined ? input.contactEmail : (existing?.contact_email ?? null),
    footer_html: input.footerHtml !== undefined ? input.footerHtml : (existing?.footer_html ?? null),
    updated_at: db.fn.now(3),
  }

  if (existing) {
    await db('email_company_branding').where({ company_id: companyId }).update(patch)
  } else {
    await db('email_company_branding').insert({
      company_id: companyId,
      ...patch,
      created_at: db.fn.now(3),
    })
  }

  const row = await db<EmailCompanyBrandingRow>('email_company_branding').where({ company_id: companyId }).first()
  return rowToDto(row!)
}

export function brandingToPlaceholders(branding: BrandingDto | null): Record<string, string> {
  if (!branding) {
    return {
      logoUrl: '',
      primaryColor: '#2563eb',
      footerHtml: '',
      companyName: '',
    }
  }
  return {
    logoUrl: branding.logoUrl ?? '',
    primaryColor: branding.primaryColor ?? '#2563eb',
    footerHtml: branding.footerHtml ?? '',
    companyName: branding.name,
  }
}
