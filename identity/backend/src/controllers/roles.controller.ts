import type { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/validate.js'
import * as roleRepo from '../repositories/userRole.repository.js'
import { getAssumableRoles } from '../services/userRole.service.js'

const insertRoleSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(['super_admin', 'company_admin', 'member']),
  companyId: z.string().nullable().optional(),
})

const companyUserSchema = z.object({
  companyId: z.string().min(1),
  userId: z.string().min(1),
})

const upsertSuperAdminSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
})

export async function getMyAssumableRoles(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.id
  const result = await getAssumableRoles(userId)
  res.json(result)
}

export async function listUserRolesInternal(req: Request, res: Response) {
  const userId = String(req.params.userId)
  const roles = await roleRepo.listRolesByUserId(userId)
  res.json({
    roles: roles.map((row) => ({
      id: row.id,
      userId: row.user_id,
      role: row.role,
      companyId: row.company_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    })),
  })
}

export async function listSuperAdminsInternal(_req: Request, res: Response) {
  const userIds = await roleRepo.listSuperAdminUserIds()
  res.json({ userIds })
}

export async function listCompanyAdminsInternal(req: Request, res: Response) {
  const companyId = String(req.params.companyId)
  const userIds = await roleRepo.listCompanyAdminUserIds(companyId)
  res.json({ userIds })
}

export async function insertUserRoleInternal(req: Request, res: Response) {
  const body = insertRoleSchema.parse(req.body)
  await roleRepo.insertUserRole({
    id: body.id,
    user_id: body.userId,
    role: body.role,
    company_id: body.companyId ?? null,
  })
  res.status(201).json({ status: 'ok' })
}

export async function upsertSuperAdminInternal(req: Request, res: Response) {
  const body = upsertSuperAdminSchema.parse(req.body)
  await roleRepo.upsertSuperAdminRole(body.userId, body.roleId)
  res.json({ status: 'ok' })
}

export async function promoteCompanyAdminInternal(req: Request, res: Response) {
  const body = companyUserSchema.parse(req.body)
  await roleRepo.promoteUserToCompanyAdmin(body.companyId, body.userId)
  res.json({ status: 'ok' })
}

export async function demoteMemberInternal(req: Request, res: Response) {
  const body = companyUserSchema.parse(req.body)
  await roleRepo.demoteUserToMember(body.companyId, body.userId)
  res.json({ status: 'ok' })
}
