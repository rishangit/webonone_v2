import type { Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/validate.js'
import { AuthError } from '../services/auth.service.js'
import * as customersService from '../services/customers.service.js'
import * as roleRepo from '../repositories/userRole.repository.js'

const MAX_PAGE_SIZE = 100

const listQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value ?? ''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(24),
})

const addBodySchema = z.object({
  userId: z.string().min(1),
  companyName: z.string().trim().max(200).optional().default(''),
})

const createBodySchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().trim().email().max(255).optional(),
    ),
    phoneNumber: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z
        .string()
        .trim()
        .regex(/^\+\d{7,15}$/, 'Phone number must include country code (E.164)')
        .optional(),
    ),
    companyName: z.string().trim().max(200).optional().default(''),
  })
  .refine((data) => Boolean(data.email || data.phoneNumber), {
    message: 'Email or phone number is required',
  })

async function assertCanAccessCompanyCustomers(
  user: NonNullable<AuthenticatedRequest['user']>,
  companyId: string,
): Promise<void> {
  if (user.platformRole === 'super_admin') {
    return
  }
  if (user.companyId !== companyId) {
    throw new AuthError('Forbidden', 403, 'FORBIDDEN')
  }
  if (user.platformRole === 'company_admin') {
    const adminRole = await roleRepo.findCompanyAdminRole(user.id, companyId)
    if (adminRole) return
  }
  if (user.platformRole === 'member') {
    const membership = await roleRepo.findCompanyRole(user.id, companyId)
    if (membership) return
  }
  throw new AuthError('Forbidden', 403, 'FORBIDDEN')
}

async function assertCanListCustomers(
  req: AuthenticatedRequest,
  companyId: string,
): Promise<void> {
  await assertCanAccessCompanyCustomers(req.user!, companyId)
}

async function assertCanAddCustomers(
  req: AuthenticatedRequest,
  companyId: string,
): Promise<void> {
  await assertCanAccessCompanyCustomers(req.user!, companyId)
}

export async function listCustomers(req: AuthenticatedRequest, res: Response) {
  const companyId = String(req.params.companyId)
  await assertCanListCustomers(req, companyId)
  const query = listQuerySchema.parse(req.query)

  const result = await customersService.listCompanyCustomers({
    companyId,
    search: query.search,
    page: query.page,
    pageSize: query.pageSize,
  })

  res.json(result)
}

export async function addCustomer(req: AuthenticatedRequest, res: Response) {
  const companyId = String(req.params.companyId)
  await assertCanAddCustomers(req, companyId)
  const body = addBodySchema.parse(req.body)

  const result = await customersService.addCompanyCustomer({
    companyId,
    userId: body.userId,
    companyName: body.companyName,
  })

  const status = 201
  res.status(status).json({
    ...result.customer,
    ...(result.warnings.length > 0 ? { warnings: result.warnings } : {}),
  })
}

export async function createCustomer(req: AuthenticatedRequest, res: Response) {
  const companyId = String(req.params.companyId)
  await assertCanAddCustomers(req, companyId)
  const body = createBodySchema.parse(req.body)

  const result = await customersService.createCompanyCustomer({
    companyId,
    companyName: body.companyName,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phoneNumber: body.phoneNumber,
  })

  res.status(201).json({
    ...result.customer,
    ...(result.warnings.length > 0 ? { warnings: result.warnings } : {}),
  })
}
