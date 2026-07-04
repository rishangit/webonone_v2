import { seedSuperAdminFromEnv } from '../services/seedSuperAdmin.service.js'
import { env } from '../config/env.js'

async function main() {
  await seedSuperAdminFromEnv()
  if (env.superAdminUserId) {
    console.log(`Super admin role seeded: user_id=${env.superAdminUserId} (${env.superAdminEmail})`)
  } else {
    console.warn('No SUPER_ADMIN_USER_ID set — super_admin role not seeded')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
