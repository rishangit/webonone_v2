import type { Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/validate.js'
import { AuthError } from '../services/auth.service.js'
import { getIdentityUserById, listIdentityUsers } from '../services/users.service.js'
import * as roleRepo from '../repositories/userRole.repository.js'

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

const userIdParamsSchema = z.object({
  id: z.string().min(1),
})

async function assertCanViewUser(req: AuthenticatedRequest, targetUserId: string): Promise<void> {
  const viewer = req.user!
  if (viewer.platformRole === 'super_admin') {
    return
  }
  if (viewer.platformRole === 'company_admin' && viewer.companyId) {
    const membership = await roleRepo.findCompanyRole(targetUserId, viewer.companyId)
    if (membership) {
      return
    }
  }
  if (viewer.platformRole === 'member' && viewer.companyId) {
    const viewerMembership = await roleRepo.findCompanyRole(viewer.id, viewer.companyId)
    if (viewerMembership) {
      const targetMembership = await roleRepo.findCompanyRole(targetUserId, viewer.companyId)
      if (targetMembership) {
        return
      }
    }
  }
  throw new AuthError('Forbidden', 403, 'FORBIDDEN')
}

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

export async function getUser(req: AuthenticatedRequest, res: Response) {
  const { id } = userIdParamsSchema.parse(req.params)
  await assertCanViewUser(req, id)
  const user = await getIdentityUserById(id)
  res.json({ user })
}
