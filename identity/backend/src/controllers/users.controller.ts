import type { Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/validate.js'
import { listIdentityUsers } from '../services/users.service.js'

const MAX_PAGE_SIZE = 100

const usersQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value ?? ''),
  role: z.enum(['super_admin', 'company_admin', 'member']).optional().nullable(),
  excludeCompanyId: z.string().min(1).optional().nullable(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
})

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  const query = usersQuerySchema.parse(req.query)

  const result = await listIdentityUsers({
    search: query.search,
    role: query.role ?? null,
    excludeCompanyId: query.excludeCompanyId ?? null,
    page: query.page,
    pageSize: query.pageSize,
  })

  res.json(result)
}
