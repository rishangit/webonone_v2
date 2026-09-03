import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

const onListen = () => {
  if (env.iisHosted) {
    console.log(`Support API listening on IIS HttpPlatform port ${env.port}`)
    return
  }
  console.log(`Support API listening on http://${env.host}:${env.port}`)
}

if (env.iisHosted) {
  app.listen(env.port, onListen)
} else {
  app.listen(env.port, env.host, onListen)
}
