import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { WebsiteImagePicker } from '../../components/WebsiteImagePicker'
import { emptyLayoutByBreakpoint } from '../../types'
import type { WebsiteAddon, WebsiteBreakpoint } from '../../types'
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

function ImageAddonRenderer({ addon, breakpoint }: AddonRenderProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'image') return null
  const media = mediaForBreakpoint(addon.props.mediaByBreakpoint, breakpoint)
  if (!media?.url) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-muted-foreground/40 text-sm text-muted-foreground">
        {t('image')}
      </div>
    )
  }
  const height = addon.props.heightMode === 'fixed' ? addon.props.fixedHeight : '100%'
  return (
    <img
      src={media.url}
      alt=""
      className="h-full w-full"
      style={{
        objectFit: addon.props.fit,
        height,
      }}
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

  return (
    <>
      <Button type="button" onClick={() => setPicker(true)}>
        {t('pickImage')}
      </Button>
      <p className="text-sm text-muted-foreground">{t('perBreakpointImage')}</p>
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
        onSelect={(media) =>
          onChange({
            ...addon,
            props: {
              ...addon.props,
              mediaByBreakpoint: { ...addon.props.mediaByBreakpoint, [breakpoint]: media },
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
