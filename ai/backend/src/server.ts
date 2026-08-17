import { env } from './config/env.js'
import { createApp } from './app.js'
import { db } from './models/db.js'
import { discoverAllCapabilities, type CapabilityPeer } from './ai/tools/discoverCapabilities.js'
import { HttpToolExecutor } from './ai/tools/executor.js'
import { ToolRegistry } from './ai/tools/registry.js'
import { createAiSettingsService } from './services/aiSettings.service.js'
import { createKnexConversationRepository } from './services/conversation.repository.js'
import { createConversationService } from './services/conversation.service.js'
import { createMemoryRateLimiter } from './middleware/rateLimit.js'

const registry = new ToolRegistry()
const executor = new HttpToolExecutor({
  registry,
  peers: {
    webonone: {
      apiBaseUrl: env.webononeApiBaseUrl,
      serviceApiKey: env.webononeServiceApiKey,
    },
    data: {
      apiBaseUrl: env.dataApiBaseUrl,
      serviceApiKey: env.dataServiceApiKey,
    },
  },
  timeoutMs: env.aiToolHttpTimeoutMs,
})

function configuredPeers(): CapabilityPeer[] {
  const peers: CapabilityPeer[] = []
  if (env.webononeApiBaseUrl && env.webononeServiceApiKey) {
    peers.push({
      service: 'webonone',
      apiBaseUrl: env.webononeApiBaseUrl,
      serviceApiKey: env.webononeServiceApiKey,
    })
  }
  if (env.dataApiBaseUrl && env.dataServiceApiKey) {
    peers.push({
      service: 'data',
      apiBaseUrl: env.dataApiBaseUrl,
      serviceApiKey: env.dataServiceApiKey,
    })
  }
  return peers
}

async function refreshCapabilities() {
  const tools = await discoverAllCapabilities(configuredPeers())
  registry.replace(tools)
}

const aiSettingsService = createAiSettingsService()

const conversationService = createConversationService({
  repository: createKnexConversationRepository(db),
  resolveProvider: (ctx) => aiSettingsService.resolveProvider(ctx),
  defaultSystemPrompt: env.aiSystemPrompt,
  registry,
  executor,
})

const app = createApp({
  conversationService,
  aiSettingsService,
  rateLimiter: createMemoryRateLimiter({
    max: env.guestRateLimitMax,
    windowMs: env.guestRateLimitWindowMs,
  }),
})

const onListen = () => {
  if (env.iisHosted) {
    console.log(`AI API listening on IIS HttpPlatform port ${env.port}`)
    return
  }
  console.log(`AI API listening on http://${env.host}:${env.port}`)
}

void refreshCapabilities().then(() => {
  if (env.aiCapabilityRefreshMs > 0) {
    const timer = setInterval(() => {
      void refreshCapabilities()
    }, env.aiCapabilityRefreshMs)
    timer.unref()
  }
})

if (env.iisHosted) {
  app.listen(env.port, onListen)
} else {
  app.listen(env.port, env.host, onListen)
}
