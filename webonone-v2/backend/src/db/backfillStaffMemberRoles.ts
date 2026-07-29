import { backfillStaffMemberRoles } from '../services/companyStaff.service.js'

async function main() {
  const result = await backfillStaffMemberRoles()
  console.log(
    `Staff member roles backfill complete: total=${result.total} ensured=${result.ensured} failed=${result.failed}`,
  )
  if (result.failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
