import { env } from '../config/env.js'
import type { WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../schemas/websiteDocument.schema.js'

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

function rewriteAddon(addon: WebsiteAddon): WebsiteAddon {
  if (addon.type === 'image') {
    return {
      ...addon,
      props: {
        ...addon.props,
        mediaByBreakpoint: rewriteMediaByBreakpoint(addon.props.mediaByBreakpoint),
      },
    }
  }
  if (addon.type === 'slider') {
    return {
      ...addon,
      props: {
        ...addon.props,
        slideTemplate: addon.props.slideTemplate ? rewriteBlock(addon.props.slideTemplate) : null,
        manualSlides: addon.props.manualSlides.map((slide) => ({
          ...slide,
          data: rewriteSlideData(slide.data),
        })),
      },
    }
  }
  return addon
}

function rewriteSlideData(data: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...data }
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      next[key] = value
        .map((entry) => (isMediaLike(entry) ? resolveMediaRefUrl(entry as MediaRef) : entry))
        .filter((entry) => entry != null)
      continue
    }
    if (isMediaLike(value)) {
      next[key] = resolveMediaRefUrl(value as MediaRef)
    }
  }
  return next
}

function isMediaLike(value: unknown): value is MediaRef {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as MediaRef).fileId === 'string' &&
      typeof (value as MediaRef).url === 'string',
  )
}

function rewriteBlock(block: WebsiteBlock): WebsiteBlock {
  return {
    ...block,
    addons: block.addons.map(rewriteAddon),
    children: (block.children ?? []).map(rewriteBlock),
  }
}

/** Rewrite stored Media dev URLs to the configured public Media base for anonymous site visitors. */
export function rewriteWebsiteDocumentMedia(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  return {
    ...document,
    blocks: document.blocks.map(rewriteBlock),
  }
}
