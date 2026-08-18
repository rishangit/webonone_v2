import { useTranslation } from 'react-i18next'
import { FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { resolveTextStyle } from '../../document/theme'
import { emptyLayoutByBreakpoint } from '../../types'
import type { WebsiteAddon } from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'

function TextAddonRenderer({ addon, breakpoint, theme, interactive }: AddonRenderProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'text') return null
  const style = theme?.textStyles.find((item) => item.id === addon.props.textStyleId)
  const snap = style ? resolveTextStyle(theme ?? null, style, breakpoint) : addon.props.snapshot
  const size = addon.props.fontSizeByBreakpoint?.[breakpoint] ?? snap.size
  return (
    <div
      className="h-full w-full overflow-hidden whitespace-pre-wrap p-2"
      style={{
        fontFamily: snap.fontFamily,
        fontSize: size,
        color: snap.color,
      }}
    >
      {addon.props.content || (interactive ? t('text') : '')}
    </div>
  )
}

function TextAddonPropsFields({ addon, breakpoint, theme, onChange }: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'text') return null

  return (
    <>
      <FormField label={t('textStyle')} htmlFor="text-style">
        <Select
          value={addon.props.textStyleId || '__none'}
          onValueChange={(value) =>
            onChange({
              ...addon,
              props: { ...addon.props, textStyleId: value === '__none' ? '' : value },
            })
          }
        >
          <SelectTrigger id="text-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t('common:none')}</SelectItem>
            {(theme?.textStyles ?? []).map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('content')} htmlFor="text-content">
        <Textarea
          id="text-content"
          value={addon.props.content}
          onChange={(event) =>
            onChange({
              ...addon,
              props: { ...addon.props, content: event.target.value },
            })
          }
        />
      </FormField>
      <FormField label={t('fontSize')} htmlFor="text-size">
        <Input
          id="text-size"
          type="number"
          value={addon.props.fontSizeByBreakpoint?.[breakpoint] ?? ''}
          onChange={(event) =>
            onChange({
              ...addon,
              props: {
                ...addon.props,
                fontSizeByBreakpoint: {
                  ...addon.props.fontSizeByBreakpoint,
                  [breakpoint]: Number(event.target.value) || undefined,
                },
              },
            })
          }
        />
      </FormField>
    </>
  )
}

function createDefaultTextAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'text',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 72, colSpan: 12 }),
    props: {
      textStyleId: '',
      content: 'Text',
      snapshot: { fontFamily: 'inherit', size: 16, color: '#111827' },
    },
  }
}

export const textAddonModule: AddonModule = {
  type: 'text',
  labelKey: 'text',
  descriptionKey: 'textDescription',
  createDefaultAddon: createDefaultTextAddon,
  RenderComponent: TextAddonRenderer,
  PropsFields: TextAddonPropsFields,
}
