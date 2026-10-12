import type { CompanyEvent, EventGalleryImage } from '@/features/calendar/types/event.types'

/** Service + space gallery images for event/session overview (deduped by mediaId). */
export function combineEventGalleryImages(detail: CompanyEvent): EventGalleryImage[] {
  const seen = new Set<string>()
  const combined: EventGalleryImage[] = []
  for (const image of [
    ...(detail.serviceGalleryImages ?? []),
    ...(detail.spaceGalleryImages ?? []),
  ]) {
    if (!image.mediaId || seen.has(image.mediaId)) continue
    seen.add(image.mediaId)
    combined.push(image)
  }
  return combined
}
