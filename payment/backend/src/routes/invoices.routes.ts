import { Router } from 'express'
import * as invoicesController from '../controllers/invoices.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get(
  '/dashboard/summary',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  invoicesController.dashboardSummaryHandler,
)

router.get(
  '/invoices',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  invoicesController.listInvoicesHandler,
)

router.get(
  '/invoices/by-reference/:reference',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  invoicesController.getInvoiceByReferenceHandler,
)

router.post(
  '/invoices/mark-paid-by-reference',
  requireAuth,
  requireRole('super_admin'),
  invoicesController.markPaidByReferenceHandler,
)

router.get(
  '/invoices/:id',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  invoicesController.getInvoiceHandler,
)

router.post(
  '/invoices/:id/mark-paid',
  requireAuth,
  requireRole('super_admin'),
  invoicesController.markPaidHandler,
)

router.post(
  '/invoices/:id/submit-payment-proof',
  requireAuth,
  requireRole('company_admin'),
  invoicesController.submitPaymentProofHandler,
)

router.post(
  '/invoices/:id/reject-payment-proof',
  requireAuth,
  requireRole('super_admin'),
  invoicesController.rejectPaymentProofHandler,
)

router.post(
  '/invoices/:id/void',
  requireAuth,
  requireRole('super_admin'),
  invoicesController.voidInvoiceHandler,
)

export default router
