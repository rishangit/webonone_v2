import { createApp } from './app.js'
import { env } from './config/env.js'
import { startReaper } from './workers/reaper.js'

const app = createApp()

const onListen = () => {
  startReaper()
  if (env.iisHosted) {
    console.log(`SMS API listening on IIS HttpPlatform port ${env.port}`)
    return
  }
  console.log(`SMS API listening on http://${env.host}:${env.port}`)
}

if (env.iisHosted) {
  app.listen(env.port, onListen)
} else {
  app.listen(env.port, env.host, onListen)
}
