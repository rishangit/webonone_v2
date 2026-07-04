import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import * as roleRepo from '../repositories/userRole.repository.js'

export async function seedSuperAdminFromEnv(): Promise<void> {
  if (!env.superAdminUserId) {
    console.warn('[seed] SUPER_ADMIN_USER_ID not set — skipping super_admin role seed')
    return
  }

  await roleRepo.upsertSuperAdminRole(env.superAdminUserId, nanoid())
}
