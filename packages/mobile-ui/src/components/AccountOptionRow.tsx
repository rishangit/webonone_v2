import { Pressable, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { useThemeColors } from '../theme/ThemeProvider'
import { ImagePreview } from './ImagePreview'
import { StatusTag, isStatusTagVariant, type StatusTagVariant } from './StatusTag'
import { Body } from './Typography'

export function resolveAccountRoleVariant(role: string, accountKind?: 'staff'): StatusTagVariant {
  if (accountKind === 'staff') return 'staff'
  if (isStatusTagVariant(role)) return role
  return 'member'
}

export type AccountOptionRowProps = {
  title: string
  role: string
  accountKind?: 'staff'
  companyId?: string | null
  logoUrl?: string | null
  logoAlt?: string
  selected?: boolean
  onPress?: () => void
  className?: string
}

export function AccountOptionRow({
  title,
  role,
  accountKind,
  companyId,
  logoUrl,
  logoAlt,
  selected = false,
  onPress,
  className,
}: AccountOptionRowProps) {
  const colors = useThemeColors()
  const roleVariant = resolveAccountRoleVariant(role, accountKind)
  const showLogo = Boolean(companyId)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'flex-row items-start gap-3 rounded-lg border px-3 py-3',
        selected ? 'border-primary bg-primary/10' : 'border-border',
        className,
      )}
    >
      {showLogo ? (
        <ImagePreview src={logoUrl} alt={logoAlt ?? title} className="h-10 w-10 rounded-md" />
      ) : null}
      <View className="min-w-0 flex-1 gap-1">
        <Body className="font-semibold">{title}</Body>
        <StatusTag variant={roleVariant} />
      </View>
      {selected ? (
        <Check size={20} color={colors.primary} strokeWidth={2.5} className="shrink-0 self-center" />
      ) : null}
    </Pressable>
  )
}
