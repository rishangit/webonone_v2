import { useTranslation } from 'react-i18next'
import { FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { CustomWebsiteElementHost } from '../../components/CustomWebsiteElementHost'
import { buttonLabelTypography, buttonStyleAtIndex, resolveButtonStyle } from '../../document/theme'
import { paletteForColors, themePaletteColorValues } from '../../utils/websitePalette'
import { emptyLayoutByBreakpoint } from '../../types'
import type { WebsiteAddon } from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'
import { publicPageHref } from '../../utils/companyPublicHost'

function ButtonAddonRenderer({
  addon,
  theme,
  paletteId,
  pages = [],
  companyId,
  publish,
  interactive,
  onNavigatePage,
}: AddonRenderProps) {
  if (addon.type !== 'button') return null
  const buttonStyle = buttonStyleAtIndex(theme, addon.props.buttonStyleIndex, addon.props.buttonStyleId)
  const paintId = paletteForColors(theme, buttonStyle?.colorPaletteId, paletteId)
  const paintTheme =
    theme && paintId && buttonStyle?.textStyleId
      ? {
          ...theme,
          textStyles: theme.textStyles.map((style) =>
            style.id === buttonStyle.textStyleId ? { ...style, colorPaletteId: paintId } : style,
          ),
        }
      : theme
  const paintButton = buttonStyle && paintId ? { ...buttonStyle, colorPaletteId: paintId } : buttonStyle
  const snap = paintButton ? resolveButtonStyle(paintTheme ?? null, paintButton) : addon.props.snapshot
  const page = pages.find((item) => item.id === addon.props.linkPageId)
  const href = publish && page && companyId ? publicPageHref(companyId, page.path) : undefined
  const style = {
    ...buttonLabelTypography(),
    background: snap.background,
    color: snap.textColor,
    border: `${snap.borderWidth}px solid ${snap.borderColor}`,
    borderRadius: snap.radius,
    fontFamily: snap.fontFamily,
    fontSize: snap.fontSize,
  }
  const scopeId = buttonStyle?.id ?? addon.id
  const customization = buttonStyle?.customization
  const label = addon.props.label

  const fallback =
    publish && href ? (
      <a
        href={href}
        className="inline-flex h-full w-full items-center justify-center px-3 no-underline"
        style={style}
        onClick={(event) => {
          if (onNavigatePage && page) {
            event.preventDefault()
            onNavigatePage(page.path)
          }
        }}
      >
        {label}
      </a>
    ) : (
      <span
        className="inline-flex h-full w-full items-center justify-center px-3"
        style={{
          ...style,
          textDecoration: addon.props.linkPageId ? 'underline' : undefined,
          cursor: interactive ? 'default' : 'pointer',
        }}
      >
        {label}
      </span>
    )

  return (
    <CustomWebsiteElementHost
      scopeId={scopeId}
      kind="button"
      customization={customization}
      placeholders={{ label }}
      baseStyle={style}
      paletteColors={theme ? themePaletteColorValues(theme, paintId) : undefined}
      className="inline-flex h-full w-full"
      scriptContext={{ publish, href }}
      fallback={fallback}
    />
  )
}

function ButtonAddonPropsFields({ addon, theme, pages, onChange }: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'button') return null

  const styles = theme?.buttonStyles ?? []
  const selected = buttonStyleAtIndex(theme, addon.props.buttonStyleIndex, addon.props.buttonStyleId)

  return (
    <>
      <FormField label={t('label')} htmlFor="button-label">
        <Input
          id="button-label"
          value={addon.props.label}
          onChange={(event) =>
            onChange({
              ...addon,
              props: { ...addon.props, label: event.target.value },
            })
          }
        />
      </FormField>
      <FormField label={t('buttonStyle')} htmlFor="button-style">
        <Select
          value={selected?.id || '__none'}
          onValueChange={(value) => {
            if (value === '__none') {
              onChange({
                ...addon,
                props: { ...addon.props, buttonStyleId: '', buttonStyleIndex: null },
              })
              return
            }
            const buttonStyleIndex = styles.findIndex((style) => style.id === value)
            onChange({
              ...addon,
              props: {
                ...addon.props,
                buttonStyleId: value,
                buttonStyleIndex: buttonStyleIndex >= 0 ? buttonStyleIndex : null,
              },
            })
          }}
        >
          <SelectTrigger id="button-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t('common:none')}</SelectItem>
            {styles.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('linkPage')} htmlFor="button-link">
        <Select
          value={addon.props.linkPageId || '__none'}
          onValueChange={(value) =>
            onChange({
              ...addon,
              props: { ...addon.props, linkPageId: value === '__none' ? null : value },
            })
          }
        >
          <SelectTrigger id="button-link">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t('noLink')}</SelectItem>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </>
  )
}

function createDefaultButtonAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'button',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 80, colSpan: 4 }),
    props: {
      buttonStyleId: '',
      label: 'Button',
      linkPageId: null,
      snapshot: {
        background: '#111827',
        textColor: '#ffffff',
        borderColor: 'transparent',
        borderWidth: 0,
        radius: 6,
        fontFamily: 'inherit',
        fontSize: 16,
      },
    },
  }
}

export const buttonAddonModule: AddonModule = {
  type: 'button',
  labelKey: 'button',
  descriptionKey: 'buttonDescription',
  createDefaultAddon: createDefaultButtonAddon,
  RenderComponent: ButtonAddonRenderer,
  PropsFields: ButtonAddonPropsFields,
}
