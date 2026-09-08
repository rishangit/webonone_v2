import { env } from '../config/env.js'
import type { WebsiteDocumentV1 } from '../schemas/websiteDocument.schema.js'

type MediaRef = {
  fileId: string
  url: string
  fileName?: string
  mimeType?: string
}

const LOCAL_MEDIA_FILE =
  /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api\/v1(\/files\/[^?#]+)/i

function rewriteMediaFileUrl(url: string): string {
  const base = env.mediaPublicBaseUrl.replace(/\/$/, '')
  return url.replace(LOCAL_MEDIA_FILE, `${base}$1`)
}

function resolveMediaRefUrl(ref: MediaRef | undefined): MediaRef | undefined {
  if (!ref?.fileId) return ref

  const trimmedUrl = ref.url?.trim()
  if (trimmedUrl) {
    return { ...ref, url: rewriteMediaFileUrl(trimmedUrl) }
  }

  const fileName = ref.fileName?.trim() || 'file'
  const base = env.mediaPublicBaseUrl.replace(/\/$/, '')
  return {
    ...ref,
    url: `${base}/files/${encodeURIComponent(ref.fileId)}/${encodeURIComponent(fileName)}`,
  }
}

function rewriteMediaByBreakpoint(
  mediaByBreakpoint: Partial<Record<string, MediaRef>> | undefined,
): Partial<Record<string, MediaRef>> {
  if (!mediaByBreakpoint) return {}
  const next: Partial<Record<string, MediaRef>> = {}
  for (const [key, ref] of Object.entries(mediaByBreakpoint)) {
    const resolved = resolveMediaRefUrl(ref)
    if (resolved) next[key] = resolved
  }
  return next
}

function rewriteImagesByBreakpoint(
  imagesByBreakpoint: Partial<Record<string, MediaRef[]>> | undefined,
): Partial<Record<string, MediaRef[]>> {
  if (!imagesByBreakpoint) return {}
  const next: Partial<Record<string, MediaRef[]>> = {}
  for (const [key, slides] of Object.entries(imagesByBreakpoint)) {
    if (!slides?.length) continue
    next[key] = slides
      .map((slide) => resolveMediaRefUrl(slide))
      .filter((slide): slide is MediaRef => Boolean(slide))
  }
  return next
}

/** Rewrite stored Media dev URLs to the configured public Media base for anonymous site visitors. */
export function rewriteWebsiteDocumentMedia(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: document.blocks.map((block) => ({
      ...block,
      addons: block.addons.map((addon) => {
        if (addon.type === 'image') {
          return {
            ...addon,
            props: {
              ...addon.props,
              mediaByBreakpoint: rewriteMediaByBreakpoint(addon.props.mediaByBreakpoint),
            },
          }
        }
        if (addon.type === 'imageSlider') {
          return {
            ...addon,
            props: {
              ...addon.props,
              imagesByBreakpoint: rewriteImagesByBreakpoint(addon.props.imagesByBreakpoint),
            },
          }
        }
        return addon
      }),
    })),
  }
}
