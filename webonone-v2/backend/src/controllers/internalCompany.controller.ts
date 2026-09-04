import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import * as companyRepo from '../repositories/company.repository.js'
import { companyWebUrl, isCompanyWebSlug } from '../utils/companyWebSlug.js'
import { rewriteOptionalMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'

function toInternalCompany(company: companyRepo.CompanyRow) {
  return {
    id: company.id,
    name: company.name,
    webSlug: company.web_slug,
    webUrl: companyWebUrl(company.web_slug, env.companySiteHost),
    status: company.status,
    logoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
    contactEmail: company.contact_email,
    contactPersonUserId: company.contact_person_user_id,
  }
}

/** Internal: peers resolve company details from WebOnOne (no shared DB). */
export async function getCompanyInternal(req: Request, res: Response) {
  const companyId = String(req.params.id ?? '').trim()
  if (!companyId || companyId.length !== 21) {
    res.status(400).json({ message: 'Invalid company id', code: 'INVALID_COMPANY_ID' })
    return
  }

  const company = await companyRepo.findCompanyById(companyId)
  if (!company) {
    res.status(404).json({ message: 'Company not found', code: 'COMPANY_NOT_FOUND' })
    return
  }

  res.json(toInternalCompany(company))
}

export async function getCompanyBySlugInternal(req: Request, res: Response) {
  const slug = String(req.params.slug ?? '').trim().toLowerCase()
  if (!isCompanyWebSlug(slug)) {
    res.status(400).json({ message: 'Invalid company web slug', code: 'INVALID_COMPANY_SLUG' })
    return
  }

  const company = await companyRepo.findCompanyByWebSlug(slug)
  if (!company) {
    res.status(404).json({ message: 'Company not found', code: 'COMPANY_NOT_FOUND' })
    return
  }

  res.json(toInternalCompany(company))
}
