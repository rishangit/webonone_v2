/**
 * Backfill WebOnOne companies into Payment (system billing mirror).
 *
 * - Approved → active subscription + invoice generation from approved_at
 * - Pending / rejected → inactive mirror (no new invoices)
 * - Purges Payment companies not present in WebOnOne (e.g. local "Acme Test")
 *
 * Requires Payment API running and PAYMENT_* env on this service.
 *
 *   npm run sync:payment-companies -w @webonone/webonone-backend
 */
import { listAllCompanies } from '../services/company.service.js'
import {
  purgePaymentOrphanCompanies,
  upsertPaymentCompanyStrict,
} from '../services/paymentClient.service.js'

async function main() {
  const companies = await listAllCompanies()
  console.log(`Syncing ${companies.length} WebOnOne company(ies) to Payment…`)

  let synced = 0
  for (const company of companies) {
    const active = company.status === 'approved'
    await upsertPaymentCompanyStrict({
      companyId: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      activatedAt: active ? (company.approvedAt ?? new Date().toISOString()) : null,
      status: active ? 'active' : 'inactive',
    })
    synced += 1
    console.log(
      `  ✓ ${company.name} (${company.id}) → ${active ? 'active' : 'inactive'} [${company.status}]`,
    )
  }

  const deleted = await purgePaymentOrphanCompanies(companies.map((c) => c.id))
  if (deleted.length > 0) {
    console.log(`Purged ${deleted.length} orphan Payment company(ies): ${deleted.join(', ')}`)
  } else {
    console.log('No orphan Payment companies to purge.')
  }

  console.log(`Payment company sync complete: synced=${synced} purged=${deleted.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
