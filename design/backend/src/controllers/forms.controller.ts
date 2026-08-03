import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import {
  createForm,
  deleteForm,
  getForm,
  HttpError,
  listForms,
  updateForm,
} from '../services/form.service.js'
import { createFormSchema, updateFormSchema } from '../schemas/formSchemas.js'
import type { FormTemplateStatus } from '../models/db.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) {
    throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  }
  return companyId
}

export async function listFormsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = companyIdOrThrow(req)
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const status =
      typeof req.query.status === 'string' && (req.query.status === 'draft' || req.query.status === 'published')
        ? (req.query.status as FormTemplateStatus)
        : undefined

    const result = await listForms({ companyId, page, pageSize, q, status })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getFormHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = companyIdOrThrow(req)
    const id = String(req.params.id)
    const form = await getForm({ companyId, id })
    res.json({ form })
  } catch (err) {
    next(err)
  }
}

export async function createFormHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = companyIdOrThrow(req)
    const body = createFormSchema.parse(req.body)
    const form = await createForm({ companyId, userId: req.user!.id, body })
    res.status(201).json({ form })
  } catch (err) {
    next(err)
  }
}

export async function updateFormHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = companyIdOrThrow(req)
    const id = String(req.params.id)
    const body = updateFormSchema.parse(req.body)
    const form = await updateForm({ companyId, id, body })
    res.json({ form })
  } catch (err) {
    next(err)
  }
}

export async function deleteFormHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = companyIdOrThrow(req)
    const id = String(req.params.id)
    await deleteForm({ companyId, id })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
