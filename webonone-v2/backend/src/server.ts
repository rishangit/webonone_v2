import { createApp } from './app.js'
import { env } from './config/env.js'
import { startSessionDueNotifyJob } from './jobs/sessionDueNotify.job.js'

const app = createApp()

const onListen = () => {
  startSessionDueNotifyJob()
  if (env.iisHosted) {
    console.log(`WebOnOne API listening on IIS HttpPlatform port ${env.port}`)
    return
  }
  console.log(`WebOnOne API listening on http://${env.host}:${env.port}`)
}

if (env.iisHosted) {
  app.listen(env.port, onListen)
} else {
  app.listen(env.port, env.host, onListen)
}
