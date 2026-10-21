import { useTranslation } from 'react-i18next'
import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { CustomWebsiteElementHost } from '../../components/CustomWebsiteElementHost'
import { PageLinkFields } from '../../components/PageLinkFields'
import { pageLinkHref } from '../../document/pageLink'
import { resolveTextStyle, textStyleAtIndex } from '../../document/theme'
import { paletteForColors, themePaletteColorValues } from '../../utils/websitePalette'
import { emptyLayoutByBreakpoint } from '../../types'
import type { WebsiteAddon } from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'

function TextAddonRenderer({
  addon,
  breakpoint,
  theme,
  paletteId,
  pages = [],
  companyId,
  interactive,
  onNavigatePage,
}: AddonRenderProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'text') return null
  const style = textStyleAtIndex(theme, addon.props.textStyleIndex, addon.props.textStyleId)
  const paintId = paletteForColors(theme, style?.colorPaletteId, paletteId)
  const paintStyle = style && paintId ? { ...style, colorPaletteId: paintId } : style
  const snap = paintStyle ? resolveTextStyle(theme ?? null, paintStyle, breakpoint) : addon.props.snapshot
  const content = addon.props.content || (interactive ? t('text') : '')
  const link = pageLinkHref(pages, addon.props.linkPageId, companyId, !interactive)
  const baseStyle = {
    fontFamily: snap.fontFamily,
    fontSize: snap.size,
    color: snap.color,
  }

  return (
    <CustomWebsiteElementHost
      scopeId={style?.id ?? addon.id}
      kind="text"
      customization={style?.customization}
      placeholders={{ content }}
      baseStyle={baseStyle}
      paletteColors={theme ? themePaletteColorValues(theme, paintId) : undefined}
      className="h-full w-full overflow-hidden whitespace-pre-wrap p-2"
      linkHref={link?.href}
      onLinkClick={(event) => {
        if (!onNavigatePage || !link) return
        event.preventDefault()
        onNavigatePage(link.path)
      }}
      fallback={<div style={baseStyle}>{content}</div>}
    />
  )
}

function TextAddonPropsFields({ addon, theme, pages, onChange }: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'text') return null

  const styles = theme?.textStyles ?? []
  const selected = textStyleAtIndex(theme, addon.props.textStyleIndex, addon.props.textStyleId)

  return (
    <>
      <FormField label={t('textStyle')} htmlFor="text-style">
        <Select
          value={selected?.id || '__none'}
          onValueChange={(value) => {
            if (value === '__none') {
              onChange({
                ...addon,
                props: { ...addon.props, textStyleId: '', textStyleIndex: null },
              })
              return
            }
            const textStyleIndex = styles.findIndex((style) => style.id === value)
            onChange({
              ...addon,
              props: {
                ...addon.props,
                textStyleId: value,
                textStyleIndex: textStyleIndex >= 0 ? textStyleIndex : null,
              },
            })
          }}
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
      <PageLinkFields
        idPrefix="text"
        linkPageId={addon.props.linkPageId}
        pages={pages}
        onChange={(linkPageId) => onChange({ ...addon, props: { ...addon.props, linkPageId } })}
      />
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
