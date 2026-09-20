import { useState } from 'react'
import { View } from 'react-native'
import { AlignLeft, CheckSquare, ChevronDown, CircleDot, Type } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Body, Button, cn, useThemedControlIconColor } from '@webonone/mobile-ui'
import type { FormFieldType } from '@/shared/types/design.types'

const TOOLS: { type: FormFieldType; labelKey: string; icon: typeof Type }[] = [
  { type: 'text', labelKey: 'toolText', icon: Type },
  { type: 'textarea', labelKey: 'toolTextarea', icon: AlignLeft },
  { type: 'checkbox', labelKey: 'toolCheckbox', icon: CheckSquare },
  { type: 'radio', labelKey: 'toolRadio', icon: CircleDot },
  { type: 'select', labelKey: 'toolSelect', icon: ChevronDown },
]

export function FormDesignerToolbox({
  onAdd,
  disabled,
}: {
  onAdd: (type: FormFieldType) => void
  disabled?: boolean
}) {
  const { t } = useTranslation('forms')
  const iconColor = useThemedControlIconColor()
  const [expandedType, setExpandedType] = useState<FormFieldType | null>(null)

  function handleToolPress(type: FormFieldType) {
    if (disabled) return
    if (expandedType !== type) {
      setExpandedType(type)
      return
    }
    onAdd(type)
    setExpandedType(null)
  }

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {TOOLS.map((tool) => {
        const Icon = tool.icon
        const label = t(tool.labelKey)
        const expanded = expandedType === tool.type
        return (
          <Button
            key={tool.type}
            variant="outline"
            size={expanded ? 'sm' : 'icon'}
            disabled={disabled}
            accessibilityLabel={label}
            accessibilityState={{ expanded, disabled: !!disabled }}
            className={cn(
              'shrink-0 overflow-hidden',
              expanded
                ? 'max-w-full justify-start rounded-full px-3'
                : 'h-9 w-9 rounded-full p-0',
            )}
            onPress={() => handleToolPress(tool.type)}
          >
            <Icon size={16} color={iconColor} strokeWidth={2} />
            {expanded ? (
              <Body className="text-sm font-medium text-secondary">{label}</Body>
            ) : null}
          </Button>
        )
      })}
    </View>
  )
}
