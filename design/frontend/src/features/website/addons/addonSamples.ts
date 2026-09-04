import imageAddonSample from '@/assets/website/addons/sample.png'
import imageAddonSample2 from '@/assets/website/addons/sample2.jpg'

/** Bundled designer placeholders — not persisted in page JSON; shown until Media is picked. */
export const IMAGE_ADDON_SAMPLES = [imageAddonSample, imageAddonSample2] as const

export function imageAddonSampleSrc(addonId: string): string {
  const index =
    [...addonId].reduce((acc, char) => acc + char.charCodeAt(0), 0) % IMAGE_ADDON_SAMPLES.length
  return IMAGE_ADDON_SAMPLES[index]!
}

export function buildImageSliderPlaceholderSlides(addonId: string) {
  return IMAGE_ADDON_SAMPLES.map((url, index) => ({
    fileId: `sample-${addonId}-${String(index)}`,
    url,
  }))
}
