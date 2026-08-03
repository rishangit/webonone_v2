import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { CropAspectPreset, MediaTypePreset } from '@webonone/media-embed'

export type EmbedMode = 'single' | 'multiple'
export type ViewerMode = 'view' | 'edit'

export interface EmbedModeState {
  isEmbed: boolean
  parentOrigin: string | null
  scope: string | null
  mode: EmbedMode
  accept: string
  /** Initial folder when the picker opens. */
  folderPath: string
  /**
   * Navigation ceiling for breadcrumbs. Defaults to `folderPath` when the
   * query param is omitted (legacy embeds stay locked to the start folder).
   */
  scopedRoot: string
  maxFiles: number
  mediaType: MediaTypePreset | null
  crop: boolean
  defaultCropAspect: CropAspectPreset
  autoClose: boolean
  fileUrl: string | null
  mediaId: string | null
  viewerMode: ViewerMode
  selectable: boolean
  enableSelectorUpload: boolean
  cropAspectPresets: CropAspectPreset[] | null
}

function parseMediaType(value: string | null): MediaTypePreset | null {
  if (value === 'image' || value === 'pdf' || value === 'all') {
    return value
  }
  return null
}

function parseCropAspect(value: string | null): CropAspectPreset {
  const allowed: CropAspectPreset[] = ['1:1', '1:2', '2:1', '3:2', '4:3', '16:9', 'free']
  if (value && allowed.includes(value as CropAspectPreset)) {
    return value as CropAspectPreset
  }
  return 'free'
}

function parseCropAspectPresets(value: string | null): CropAspectPreset[] | null {
  if (!value?.trim()) {
    return null
  }
  const allowed: CropAspectPreset[] = ['1:1', '1:2', '2:1', '3:2', '4:3', '16:9', 'free']
  const presets = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is CropAspectPreset =>
      allowed.includes(entry as CropAspectPreset),
    )
  return presets.length ? presets : null
}

export function mediaTypeToAccept(mediaType: MediaTypePreset | null, acceptOverride: string): string {
  if (acceptOverride !== '*/*') {
    return acceptOverride
  }
  switch (mediaType) {
    case 'image':
      return 'image/*'
    case 'pdf':
      return 'application/pdf'
    case 'all':
      return '*/*'
    default:
      return acceptOverride
  }
}

export function useEmbedMode(): EmbedModeState {
  const [searchParams] = useSearchParams()

  return useMemo(() => {
    const parentOrigin = searchParams.get('parentOrigin')
    const scope = searchParams.get('scope')
    const isEmbed = Boolean(
      parentOrigin && scope && isAllowedParentOrigin(parentOrigin),
    )

    const modeParam = searchParams.get('mode')
    const mode: EmbedMode = modeParam === 'multiple' ? 'multiple' : 'single'
    const accept = searchParams.get('accept') ?? '*/*'
    const folderPath = searchParams.get('folderPath') ?? '/'
    const scopedRoot = searchParams.get('scopedRoot') ?? folderPath
    const maxFiles = Math.min(Number(searchParams.get('maxFiles') ?? 10), 50)
    const mediaType = parseMediaType(searchParams.get('mediaType'))
    const crop = searchParams.get('crop') === 'true'
    const defaultCropAspect = parseCropAspect(searchParams.get('defaultCropAspect'))
    const autoClose = searchParams.get('autoClose') === 'true'
    const fileUrl = searchParams.get('fileUrl')
    const mediaId = searchParams.get('mediaId')
    const viewerMode: ViewerMode = searchParams.get('mode') === 'edit' ? 'edit' : 'view'
    const selectable = searchParams.get('selectable') === 'true'
    const enableSelectorUpload = searchParams.get('selectorUpload') === 'true'
    const cropAspectPresets = parseCropAspectPresets(searchParams.get('cropAspectPresets'))

    return {
      isEmbed,
      parentOrigin: isEmbed ? parentOrigin : null,
      scope: isEmbed ? scope : null,
      mode,
      accept,
      folderPath,
      scopedRoot,
      maxFiles,
      mediaType,
      crop,
      defaultCropAspect,
      autoClose,
      fileUrl,
      mediaId,
      viewerMode,
      selectable,
      enableSelectorUpload,
      cropAspectPresets,
    }
  }, [searchParams])
}
