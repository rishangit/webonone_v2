/**
 * One-off: set due_at = period_end + INVOICE_DUE_DAYS for existing invoices.
 *   npx tsx scripts/recomputeDueDates.ts
 */
import dotenv from 'dotenv'
import knex from 'knex'
import path from 'path'
import { fileURLToPath } from 'url'

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(backendRoot, '.env') })

const dueDays = Number(process.env.INVOICE_DUE_DAYS ?? 14)

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'webonone_payment',
  },
})

async function main() {
  const updated = await db.raw(
    `
    UPDATE payment_invoices
    SET due_at = DATE_ADD(period_end, INTERVAL ? DAY),
        updated_at = CURRENT_TIMESTAMP(3)
    WHERE status IN ('issued', 'overdue')
    `,
    [dueDays],
  )
  const affected = (updated as [{ affectedRows?: number }, unknown])[0]?.affectedRows ?? 0
  console.log(`Recomputed due_at (= period_end + ${dueDays} days) for ${affected} invoice(s)`)

  const sample = await db('payment_invoices')
    .select('invoice_number', 'period_start', 'period_end', 'due_at', 'status')
    .orderBy('period_start', 'desc')
    .limit(5)
  console.log(JSON.stringify(sample, null, 2))
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.destroy()
  })
