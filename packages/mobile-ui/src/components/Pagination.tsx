import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Button } from './Button'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const safeCount = Math.max(1, pageCount)
  const canPrev = page > 1
  const canNext = page < safeCount
  const iconColor = useThemedControlIconColor()

  return (
    <View className="flex-row items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        accessibilityLabel="Previous page"
        disabled={!canPrev}
        onPress={() => onPageChange(page - 1)}
        className="h-11 w-11"
      >
        <ChevronLeft size={20} color={iconColor} />
      </Button>
      <Text className="px-2 text-base text-muted">
        Page {page} of {safeCount}
      </Text>
      <Button
        variant="outline"
        size="icon"
        accessibilityLabel="Next page"
        disabled={!canNext}
        onPress={() => onPageChange(page + 1)}
        className="h-11 w-11"
      >
        <ChevronRight size={20} color={iconColor} />
      </Button>
    </View>
  )
}
