import { useTranslation } from 'react-i18next'
import { FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { CustomWebsiteElementHost } from '../../components/CustomWebsiteElementHost'
import { PageLinkFields } from '../../components/PageLinkFields'
import { pageLinkHref } from '../../document/pageLink'
import { buttonLabelTypography, buttonStyleAtIndex, resolveButtonStyle } from '../../document/theme'
import { paletteForColors, themePaletteColorValues } from '../../utils/websitePalette'
import { emptyLayoutByBreakpoint } from '../../types'
import type { WebsiteAddon } from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'
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
  const link = pageLinkHref(pages, addon.props.linkPageId, companyId, !interactive)
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

  const fallback = (
    <span
      className="inline-flex h-full w-full items-center justify-center px-3"
      style={{
        ...style,
        textDecoration: link ? 'underline' : undefined,
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
      scriptContext={{ publish, href: link?.href }}
      linkHref={link?.href}
      onLinkClick={(event) => {
        if (!onNavigatePage || !link) return
        event.preventDefault()
        onNavigatePage(link.path)
      }}
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
      <PageLinkFields
        idPrefix="button"
        linkPageId={addon.props.linkPageId}
        pages={pages}
        onChange={(linkPageId) => onChange({ ...addon, props: { ...addon.props, linkPageId } })}
      />
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
