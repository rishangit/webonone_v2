import { env } from '../config/env.js'
import { generateAllDueInvoices } from '../services/invoice.service.js'

let timer: ReturnType<typeof setInterval> | null = null

export function startInvoiceGenerator() {
  const run = async () => {
    try {
      const result = await generateAllDueInvoices()
      if (result.created > 0) {
        console.log(`[invoiceGenerator] created ${result.created} invoice(s)`)
      }
    } catch (err) {
      console.error('[invoiceGenerator] error:', err)
    }
  }

  void run()
  timer = setInterval(run, env.invoiceGeneratorIntervalMs)
}

export function stopInvoiceGenerator() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
