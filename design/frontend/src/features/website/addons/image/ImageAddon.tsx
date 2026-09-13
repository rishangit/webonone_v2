import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  ImagePreview,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { WebsiteImagePicker } from '../../components/WebsiteImagePicker'
import { emptyLayoutByBreakpoint } from '../../types'
import type { WebsiteAddon, WebsiteBreakpoint } from '../../types'
import { resolveMediaRefUrl } from '../../utils/mediaConfig'
import { imageAddonSampleSrc } from '../addonSamples'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'

function mediaForBreakpoint(
  mediaByBreakpoint: Extract<WebsiteAddon, { type: 'image' }>['props']['mediaByBreakpoint'],
  breakpoint: WebsiteBreakpoint,
) {
  return (
    mediaByBreakpoint[breakpoint] ??
    mediaByBreakpoint['2xl'] ??
    mediaByBreakpoint.xl ??
    mediaByBreakpoint.lg ??
    mediaByBreakpoint.md ??
    mediaByBreakpoint.sm
  )
}

function ImageWithoutBlock({ alt, height }: { alt: string; height: number | string }) {
  return (
    <div className="h-full w-full" style={{ height }}>
      <ImagePreview
        src={null}
        alt={alt}
        mode="view"
        className="h-full w-full max-h-none max-w-none"
      />
    </div>
  )
}

function ImageAddonRenderer({ addon, breakpoint, publish }: AddonRenderProps) {
  const { t } = useTranslation('website')
  const [loadFailed, setLoadFailed] = useState(false)

  const media =
    addon.type === 'image'
      ? mediaForBreakpoint(addon.props.mediaByBreakpoint, breakpoint)
      : undefined
  const boundOrPickedUrl = media?.url?.trim() || null
  // Prefer the stored/bound URL; only synthesize from fileId when a real URL was provided.
  const resolvedSrc = boundOrPickedUrl ? resolveMediaRefUrl(media) ?? boundOrPickedUrl : null
  // Designer sample only when nothing is bound/picked yet — never mask an empty bound URL.
  const src =
    addon.type === 'image'
      ? (resolvedSrc ?? (!publish && !media ? imageAddonSampleSrc(addon.id) : null))
      : null
  const height =
    addon.type === 'image' && addon.props.heightMode === 'fixed'
      ? addon.props.fixedHeight
      : '100%'

  useEffect(() => {
    setLoadFailed(false)
  }, [src])

  if (addon.type !== 'image') return null

  if (!src || loadFailed) {
    return <ImageWithoutBlock alt={t('image')} height={height ?? '100%'} />
  }

  return (
    <img
      src={src}
      alt=""
      className="h-full w-full"
      style={{
        objectFit: addon.props.fit,
        height,
      }}
      onError={() => setLoadFailed(true)}
    />
  )
}

function ImageAddonPropsFields({ addon, breakpoint, onChange, onNestedDialogOpenChange }: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  const [pickerOpen, setPickerOpen] = useState(false)
  if (addon.type !== 'image') return null

  function setPicker(open: boolean) {
    setPickerOpen(open)
    onNestedDialogOpenChange?.(open)
  }

  const media = mediaForBreakpoint(addon.props.mediaByBreakpoint, breakpoint)
  const previewSrc = media?.url ?? imageAddonSampleSrc(addon.id)

  return (
    <>
      <FormField label={t('perBreakpointImage')} htmlFor="image-pick">
        <div>
          <ImagePreview
            src={previewSrc}
            alt={t('image')}
            mode="edit"
            onEdit={() => setPicker(true)}
          />
        </div>
      </FormField>
      <Select
        value={addon.props.fit}
        onValueChange={(fit) =>
          onChange({
            ...addon,
            props: { ...addon.props, fit: fit as 'cover' | 'contain' },
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cover">{t('fitCover')}</SelectItem>
          <SelectItem value="contain">{t('fitContain')}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={addon.props.heightMode}
        onValueChange={(heightMode) =>
          onChange({
            ...addon,
            props: { ...addon.props, heightMode: heightMode as 'auto' | 'fixed' },
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">{t('heightAuto')}</SelectItem>
          <SelectItem value="fixed">{t('heightFixed')}</SelectItem>
        </SelectContent>
      </Select>
      {addon.props.heightMode === 'fixed' ? (
        <FormField label={t('containerHeight')} htmlFor="image-height">
          <Input
            id="image-height"
            type="number"
            value={addon.props.fixedHeight ?? 160}
            onChange={(event) =>
              onChange({
                ...addon,
                props: { ...addon.props, fixedHeight: Number(event.target.value) || 160 },
              })
            }
          />
        </FormField>
      ) : null}
      <WebsiteImagePicker
        open={pickerOpen}
        onClose={() => setPicker(false)}
        onSelect={(picked) =>
          onChange({
            ...addon,
            props: {
              ...addon.props,
              mediaByBreakpoint: { ...addon.props.mediaByBreakpoint, [breakpoint]: picked },
            },
          })
        }
      />
    </>
  )
}

function createDefaultImageAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'image',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 80, colSpan: 12 }),
    props: { mediaByBreakpoint: {}, fit: 'cover', heightMode: 'auto' },
  }
}

export const imageAddonModule: AddonModule = {
  type: 'image',
  labelKey: 'image',
  descriptionKey: 'imageDescription',
  createDefaultAddon: createDefaultImageAddon,
  RenderComponent: ImageAddonRenderer,
  PropsFields: ImageAddonPropsFields,
}
