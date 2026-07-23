import { Router } from 'express'
import * as customersController from '../controllers/customers.controller.js'
import { requireAuth } from '../middleware/validate.js'

const router = Router()

router.get(
  '/companies/:companyId/customers',
  requireAuth,
  customersController.listCustomers,
)

router.post(
  '/companies/:companyId/customers',
  requireAuth,
  customersController.addCustomer,
)

router.post(
  '/companies/:companyId/customers/create',
  requireAuth,
  customersController.createCustomer,
)

export default router
