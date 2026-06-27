import { env } from '../config/env.js'
import { seedSuperAdminFromEnv } from '../services/company.service.js'

async function main() {
  await seedSuperAdminFromEnv()
  console.log(`Super admin seeded for ${env.superAdminEmail}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
