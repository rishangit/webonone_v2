import { env } from '../config/env.js'
import { seedSuperAdminFromEnv } from '../services/company.service.js'

async function main() {
  await seedSuperAdminFromEnv()
  if (env.superAdminUserId) {
    console.log(
      `Super admin role seeded: user_id=${env.superAdminUserId} (${env.superAdminEmail})`,
    )
  } else {
    console.warn('No SUPER_ADMIN_USER_ID set — super_admin role not seeded')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
