import {
  discoverPeerCapabilities,
  type CapabilityPeer,
} from './discoverCapabilities.js'
import type { ToolRegistry, ToolServiceId } from './registry.js'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function createCapabilityRefresher(
  registry: ToolRegistry,
  peers: () => CapabilityPeer[],
  discover: typeof discoverPeerCapabilities = discoverPeerCapabilities,
) {
  async function refreshCapabilities(options?: { merge?: boolean }) {
    const configured = peers()
    const batches = await Promise.all(
      configured.map(async (peer) => ({
        service: peer.service,
        tools: await discover(peer),
      })),
    )

    if (options?.merge === false) {
      registry.replace(batches.flatMap((batch) => batch.tools))
    } else {
      registry.mergeByService(batches)
    }

    for (const batch of batches) {
      console.log('[ai]', 'capabilities', batch.service, batch.tools.length)
    }
    return batches
  }

  function missingConfiguredServices(configured: CapabilityPeer[]): ToolServiceId[] {
    const loaded = new Set(registry.list().map((tool) => tool.service))
    return configured
      .map((peer) => peer.service)
      .filter((service) => !loaded.has(service))
  }

  async function ensureReady() {
    const configured = peers()
    if (configured.length === 0) {
      return
    }
    if (missingConfiguredServices(configured).length === 0) {
      return
    }
    await refreshCapabilities({ merge: true })
  }

  async function refreshWithRetry(maxAttempts = 15, delayMs = 2_000) {
    const configured = peers()
    if (configured.length === 0) {
      return
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await refreshCapabilities({ merge: attempt > 1 })
      const missing = missingConfiguredServices(configured)
      if (missing.length === 0) {
        return
      }
      if (attempt < maxAttempts) {
        console.warn('[ai]', 'capability_discovery_retry', attempt, missing.join(','))
        await sleep(delayMs)
      } else {
        console.error('[ai]', 'capability_discovery_incomplete', missing.join(','))
      }
    }
  }

  return {
    refreshCapabilities,
    ensureReady,
    refreshWithRetry,
  }
}
