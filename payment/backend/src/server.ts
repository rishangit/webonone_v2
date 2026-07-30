import { createApp } from './app.js'
import { env } from './config/env.js'
import { startInvoiceGenerator } from './workers/invoiceGenerator.js'

const app = createApp()

const onListen = () => {
  startInvoiceGenerator()
  if (env.iisHosted) {
    console.log(`Payment API listening on IIS HttpPlatform port ${env.port}`)
    return
  }
  console.log(`Payment API listening on http://${env.host}:${env.port}`)
}

if (env.iisHosted) {
  app.listen(env.port, onListen)
} else {
  app.listen(env.port, env.host, onListen)
}
