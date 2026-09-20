import { useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Edit3 } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Button } from './Button'
import { Card } from './Card'
import { Muted, Subheading } from './Typography'

export interface EditableSectionCardProps {
  title: string
  description?: string
  canEdit?: boolean
  onEdit?: () => void
  className?: string
  contentClassName?: string
  children: ReactNode
}

export function EditableSectionCard({
  title,
  description,
  canEdit = false,
  onEdit,
  className,
  contentClassName,
  children,
}: EditableSectionCardProps) {
  const iconColor = useThemedControlIconColor()
  const [editVisible, setEditVisible] = useState(false)
  const showEdit = canEdit && Boolean(onEdit)

  function revealEdit() {
    if (!showEdit) return
    setEditVisible((current) => !current)
  }

  function handleEditPress() {
    if (!onEdit) return
    setEditVisible(false)
    onEdit()
  }

  return (
    <Card className={cn('gap-4', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <Pressable
          className="min-w-0 flex-1 gap-1"
          onPress={revealEdit}
          disabled={!showEdit}
          accessibilityRole={showEdit ? 'button' : undefined}
          accessibilityLabel={showEdit ? `Show edit for ${title}` : undefined}
        >
          <Subheading>{title}</Subheading>
          {description ? <Muted>{description}</Muted> : null}
        </Pressable>
        {showEdit && editVisible ? (
          <Button
            variant="outline"
            size="icon"
            accessibilityLabel={`Edit ${title}`}
            onPress={handleEditPress}
            className="h-12 w-12 shrink-0"
          >
            <Edit3 size={20} color={iconColor} strokeWidth={2} />
          </Button>
        ) : null}
      </View>
      <Pressable onPress={revealEdit} disabled={!showEdit}>
        <View className={cn('gap-4', contentClassName)}>{children}</View>
      </Pressable>
    </Card>
  )
}
