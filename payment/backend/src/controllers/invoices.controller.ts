import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import {
  getDashboardSummary,
  getInvoiceById,
  getInvoiceByPaymentReference,
  listInvoices,
  markInvoicePaid,
  markInvoicePaidByReference,
  rejectPaymentProof,
  submitPaymentProof,
  voidInvoice,
  type InvoiceListQuery,
} from '../services/invoice.service.js'
import type { InvoiceStatus } from '../models/db.js'
import { z } from 'zod'

function scopeCompanyId(req: AuthenticatedRequest): string | null | undefined {
  if (req.user?.role === 'super_admin') {
    return undefined
  }
  return req.user?.companyId ?? null
}

function assertCanAccessInvoice(
  req: AuthenticatedRequest,
  invoice: { companyId: string },
): boolean {
  if (req.user?.role === 'super_admin') return true
  return Boolean(req.user?.companyId && invoice.companyId === req.user.companyId)
}

export async function listInvoicesHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1)
    const pageSize = Number(req.query.pageSize ?? 12)
    const status = (req.query.status as InvoiceStatus | 'all' | undefined) ?? 'all'
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined

    let companyId: string | null | undefined =
      typeof req.query.companyId === 'string' ? req.query.companyId : undefined
    const scoped = scopeCompanyId(req)
    if (scoped !== undefined) {
      companyId = scoped
    }

    if (req.user?.role === 'company_admin' && !companyId) {
      res.status(403).json({ message: 'Company context required', code: 'FORBIDDEN' })
      return
    }

    const query: InvoiceListQuery = {
      page,
      pageSize,
      status,
      companyId,
      q,
      from,
      to,
    }
    const result = await listInvoices(query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getInvoiceByReferenceHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const reference = String(req.params.reference ?? '')
    const invoice = await getInvoiceByPaymentReference(reference)
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    if (!assertCanAccessInvoice(req, invoice)) {
      res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
      return
    }
    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

export async function getInvoiceHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await getInvoiceById(req.params.id as string)
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    if (!assertCanAccessInvoice(req, invoice)) {
      res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
      return
    }
    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

const markPaidSchema = z.object({
  paidAt: z.string().datetime().optional().nullable(),
})

export async function markPaidHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = markPaidSchema.parse(req.body ?? {})
    const invoice = await markInvoicePaid(req.params.id as string, body.paidAt, req.user?.id)
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

const markPaidByReferenceSchema = z.object({
  paymentReference: z.string().min(1).max(32),
  paidAt: z.string().datetime().optional().nullable(),
})

export async function markPaidByReferenceHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = markPaidByReferenceSchema.parse(req.body ?? {})
    const invoice = await markInvoicePaidByReference(
      body.paymentReference,
      body.paidAt,
      req.user?.id,
    )
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

const submitPaymentProofSchema = z.object({
  mediaId: z.string().min(1).max(21),
  url: z.string().url().max(2048),
  fileName: z.string().max(255).optional().nullable(),
})

export async function submitPaymentProofHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = submitPaymentProofSchema.parse(req.body ?? {})
    const existing = await getInvoiceById(req.params.id as string)
    if (!existing) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    if (!assertCanAccessInvoice(req, existing)) {
      res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
      return
    }
    if (req.user?.role !== 'company_admin') {
      res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
      return
    }

    const invoice = await submitPaymentProof(req.params.id as string, body, req.user?.id)
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

export async function rejectPaymentProofHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const invoice = await rejectPaymentProof(req.params.id as string, req.user?.id)
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

const voidSchema = z.object({
  reason: z.string().max(1000).optional(),
})

export async function voidInvoiceHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = voidSchema.parse(req.body ?? {})
    const invoice = await voidInvoice(req.params.id as string, body.reason, req.user?.id)
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' })
      return
    }
    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

export async function dashboardSummaryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = scopeCompanyId(req)
    if (req.user?.role === 'company_admin' && !companyId) {
      res.status(403).json({ message: 'Company context required', code: 'FORBIDDEN' })
      return
    }
    const summary = await getDashboardSummary(companyId ?? undefined)
    res.json({ summary })
  } catch (err) {
    next(err)
  }
}
