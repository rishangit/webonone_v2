import { createApp } from './app.js'
import { env } from './config/env.js'
import { startQueueWorker } from './workers/queueWorker.js'

const app = createApp()

const onListen = () => {
  startQueueWorker()
  if (env.iisHosted) {
    console.log(`Email API listening on IIS HttpPlatform port ${env.port}`)
    return
  }
  console.log(`Email API listening on http://${env.host}:${env.port}`)
}

if (env.iisHosted) {
  app.listen(env.port, onListen)
} else {
  app.listen(env.port, env.host, onListen)
}
