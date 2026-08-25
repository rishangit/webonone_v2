import type { Request, Response } from 'express'
import * as companyRepo from '../repositories/company.repository.js'
import { rewriteOptionalMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'

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

  res.json({
    id: company.id,
    name: company.name,
    status: company.status,
    logoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
    contactEmail: company.contact_email,
    contactPersonUserId: company.contact_person_user_id,
  })
}
