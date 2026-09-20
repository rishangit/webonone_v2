import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { EventServiceOption } from '@/features/calendar/schemas/eventSchemas'

const client = createApiClient(env.webononeApiBaseUrl)

type CatalogGalleryImage = { mediaId: string; url: string }

type CompanyCatalogItem = {
  id: string
  bindingMode: 'linked' | 'forked' | 'custom'
  libraryEntityId: string | null
  payload: Record<string, unknown> | null
  name?: string | null
  description?: string | null
  galleryImages?: CatalogGalleryImage[] | null
}

function firstGalleryUrl(images?: CatalogGalleryImage[] | null): string | null {
  return images?.[0]?.url ?? null
}

function mapService(
  item: CompanyCatalogItem,
  hydrated?: { name?: string; timeMode?: string; durationMinutes?: number | null; startTime?: string | null; endTime?: string | null; galleryImages?: CatalogGalleryImage[] },
): EventServiceOption | null {
  const payload = (hydrated ?? item.payload ?? {}) as Record<string, unknown>
  const timeMode = payload.timeMode === 'window' ? 'window' : 'duration'
  const name =
    (typeof hydrated?.name === 'string' && hydrated.name.trim() ? hydrated.name : null) ||
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
    imageUrl: firstGalleryUrl(hydrated?.galleryImages ?? item.galleryImages),
  }
}

export async function listCompanyEventServices(search = ''): Promise<EventServiceOption[]> {
  const result = await client<{ items: CompanyCatalogItem[] }>('/company/me/catalog/services')
  const items = result.items ?? []
  const linked = items.filter((item) => item.bindingMode === 'linked' && item.libraryEntityId)
  const libraryById = new Map<string, Awaited<ReturnType<typeof dataAdminApi.getService>>>()
  await Promise.all(
    linked.map(async (item) => {
      const libraryId = item.libraryEntityId
      if (!libraryId) return
      try {
        libraryById.set(libraryId, await dataAdminApi.getService(libraryId))
      } catch {
        // Soft degrade — skip unavailable library rows.
      }
    }),
  )

  const mapped = items
    .map((item) => {
      if (item.bindingMode === 'linked' && item.libraryEntityId) {
        const library = libraryById.get(item.libraryEntityId)
        if (!library) return null
        return mapService(item, library)
      }
      return mapService(item)
    })
    .filter((item): item is EventServiceOption => item != null)

  const needle = search.trim().toLowerCase()
  if (!needle) return mapped
  return mapped.filter((item) => item.name.toLowerCase().includes(needle))
}

export function formatEventServiceDescription(service: EventServiceOption): string {
  return service.timeMode === 'window'
    ? `Specific time · ${service.startTime ?? '—'}–${service.endTime ?? '—'}`
    : `Duration · ${service.durationMinutes ?? '—'} min`
}
