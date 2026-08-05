import { backfillSessionTokenMemberRoles } from '../services/companyEvent.service.js'

async function main() {
  const result = await backfillSessionTokenMemberRoles()
  console.log(
    `Session token member roles backfill complete: total=${result.total} ensured=${result.ensured} failed=${result.failed}`,
  )
  if (result.failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
