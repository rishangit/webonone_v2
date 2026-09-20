import { Image, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ImagePreview } from '@webonone/mobile-ui'
import { resolveMediaForBreakpoint } from '@/features/design/website/canvas/resolveMedia'
import { resolveMenuSettings } from '@/features/design/website/addons/menu/menuItemUtils'
import { resolveButtonStyle, resolveTextStyle } from '@/features/design/website/document/theme'
import { parseGoogleFontFamily } from '@/features/design/website/utils/parseGoogleFontFamily'
import type { WebsiteAddon, WebsiteBreakpoint, WebsiteTheme } from '@/features/design/website/types'

interface WebsiteAddonViewProps {
  addon: Exclude<WebsiteAddon, { type: 'slider' }>
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
}

export function WebsiteAddonView({
  addon,
  breakpoint,
  theme,
}: WebsiteAddonViewProps) {
  const { t } = useTranslation('website')
  const bodyText = theme?.bodyTextColor || '#111827'

  if (addon.type === 'image') {
    const media = resolveMediaForBreakpoint(addon.props.mediaByBreakpoint, breakpoint)
    return (
      <View pointerEvents="none" style={{ flex: 1 }}>
        {media?.url ? (
          <Image
            source={{ uri: media.url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={addon.props.fit === 'contain' ? 'contain' : 'cover'}
          />
        ) : (
          <ImagePreview src={null} alt={t('image')} className="h-full w-full" />
        )}
      </View>
    )
  }

  if (addon.type === 'text') {
    const style = theme?.textStyles.find((item) => item.id === addon.props.textStyleId)
    const snap = theme ? resolveTextStyle(theme, style, breakpoint) : addon.props.snapshot
    const family = parseGoogleFontFamily(snap.googleFontUrl ?? '') || snap.fontFamily
    return (
      <View pointerEvents="none" style={{ flex: 1, justifyContent: 'center' }}>
        <Text
          style={{
            color: snap.color || bodyText,
            fontSize: snap.size,
            fontFamily: family && family !== 'inherit' ? family : undefined,
          }}
        >
          {addon.props.content || t('text')}
        </Text>
      </View>
    )
  }

  if (addon.type === 'button') {
    const button = theme?.buttonStyles.find((item) => item.id === addon.props.buttonStyleId)
    const snap = theme ? resolveButtonStyle(theme, button) : addon.props.snapshot
    const family = parseGoogleFontFamily(snap.googleFontUrl ?? '') || snap.fontFamily
    return (
      <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            backgroundColor: snap.background,
            borderRadius: snap.radius,
            borderColor: snap.borderColor,
            borderWidth: snap.borderWidth,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: snap.textColor,
              fontSize: snap.fontSize,
              fontFamily: family && family !== 'inherit' ? family : undefined,
            }}
          >
            {addon.props.label || t('button')}
          </Text>
        </View>
      </View>
    )
  }

  const menu = resolveMenuSettings(addon.props, breakpoint)
  return (
    <View pointerEvents="none" style={{ flex: 1, justifyContent: 'center', padding: 8 }}>
      <View
        className="flex-row flex-wrap gap-2"
        style={{
          justifyContent:
            menu.align === 'center' ? 'center' : menu.align === 'end' ? 'flex-end' : 'flex-start',
        }}
      >
        {addon.props.items.map((item) => {
          const style = theme?.textStyles.find((entry) => entry.id === item.textStyleId)
          const snap = theme ? resolveTextStyle(theme, style, breakpoint) : null
          const family = snap
            ? parseGoogleFontFamily(snap.googleFontUrl ?? '') || snap.fontFamily
            : undefined
          return (
            <Text
              key={item.id}
              style={{
                color: snap?.color || bodyText,
                fontSize: snap?.size ?? 14,
                fontFamily: family && family !== 'inherit' ? family : undefined,
              }}
            >
              {item.label}
            </Text>
          )
        })}
      </View>
    </View>
  )
}
