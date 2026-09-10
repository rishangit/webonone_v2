import type { Request, Response } from 'express'
import { findUserById, toUserProfile } from '../models/user.repository.js'
import * as roleRepo from '../repositories/userRole.repository.js'

/** Service-to-service: company members (admin + member) with public profile fields. */
export async function listCompanyMembersInternal(req: Request, res: Response) {
  const companyId = String(req.params.companyId ?? '').trim()
  if (!companyId) {
    res.status(400).json({ message: 'companyId is required', code: 'VALIDATION_ERROR' })
    return
  }

  const roles = await roleRepo.listCompanyMemberRoles(companyId)
  const items = (
    await Promise.all(
      roles.map(async (entry) => {
        const user = await findUserById(entry.user_id)
        if (!user) return null
        const profile = toUserProfile(user)
        return {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          role: entry.role,
        }
      }),
    )
  ).filter((item): item is NonNullable<typeof item> => item != null)

  items.sort((a, b) => a.displayName.localeCompare(b.displayName))
  res.json({ items, total: items.length })
}
