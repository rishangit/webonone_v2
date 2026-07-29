import type { LoadServicesFn, ServiceOption } from '@webonone/ui-kit'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import { dataLibraryApi } from '@/features/company-catalog/services/dataLibraryApi'
import type { HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'
import type { EventServiceOption } from '@/features/calendar/schemas/eventSchemas'

export function formatEventServiceDescription(service: EventServiceOption): string {
  return service.timeMode === 'window'
    ? `Specific time · ${service.startTime ?? '—'}–${service.endTime ?? '—'}`
    : `Duration · ${service.durationMinutes ?? '—'} min`
}

export function mapHydratedCatalogToEventService(
  item: HydratedCatalogItem,
): EventServiceOption | null {
  if (item.libraryUnavailable) return null

  const payload = (item.payload ?? item.hydrated ?? {}) as Record<string, unknown>
  const timeMode = payload.timeMode === 'window' ? 'window' : 'duration'
  const name =
    (typeof item.displayName === 'string' && item.displayName.trim()
      ? item.displayName
      : null) ||
    (typeof item.name === 'string' && item.name.trim() ? item.name : null) ||
    (typeof payload.name === 'string' && payload.name.trim() ? payload.name : null)

  if (!name) return null

  return {
    id: item.id,
    name,
    timeMode,
    durationMinutes:
      typeof payload.durationMinutes === 'number' ? payload.durationMinutes : null,
    startTime: typeof payload.startTime === 'string' ? payload.startTime : null,
    endTime: typeof payload.endTime === 'string' ? payload.endTime : null,
  }
}

export function toServiceOption(service: EventServiceOption): ServiceOption {
  return {
    id: service.id,
    name: service.name,
    description: formatEventServiceDescription(service),
  }
}

/**
 * Company catalog services for calendar events (`company_services.id`).
 * Hydrates linked library rows (name + timeMode live in Data) before mapping.
 * Caches full `EventServiceOption` values in `cacheById` for post-select mapping.
 */
export function createCompanyCatalogServicesLoader(
  cacheById: Map<string, EventServiceOption>,
): LoadServicesFn {
  return async ({ search, page, pageSize }) => {
    const q = search.trim()
    // Load full company set — linked names live in Data, so server `q` cannot filter them.
    const result = await companyCatalogApi.list('services')
    const hydrated = await hydrateLinkedCatalogItems('services', result.items)
    let mapped = hydrated
      .map(mapHydratedCatalogToEventService)
      .filter((s): s is EventServiceOption => s != null)

    if (q) {
      const needle = q.toLowerCase()
      mapped = mapped.filter((s) => s.name.toLowerCase().includes(needle))
    }

    for (const service of mapped) {
      cacheById.set(service.id, service)
    }

    const start = (page - 1) * pageSize
    const slice = mapped.slice(start, start + pageSize)
    return {
      services: slice.map(toServiceOption),
      hasMore: start + pageSize < mapped.length,
    }
  }
}

/**
 * Data library services (global library ids — not valid as `company_events.service_id`).
 * Use when a flow needs to pick from the full Data catalog.
 */
export function createDataLibraryServicesLoader(): LoadServicesFn {
  return async ({ search, page, pageSize }) => {
    const result = await dataLibraryApi.list('services', {
      q: search.trim() || undefined,
      page,
      pageSize,
    })
    return {
      services: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description?.trim() ? item.description : null,
      })),
      hasMore: page * pageSize < result.total,
    }
  }
}
