import { Text } from 'react-native'
import { cn } from '../lib/cn'
import { normalizeHexColor } from '../lib/normalizeHexColor'

export interface TagChipProps {
  name: string
  color: string
  className?: string
}

export function TagChip({ name, color, className }: TagChipProps) {
  const resolved = normalizeHexColor(color)

  return (
    <Text className={cn('max-w-[10rem] text-xs', className)} style={{ color: resolved }} numberOfLines={1}>
      #{name}
    </Text>
  )
}
