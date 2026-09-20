import { View } from 'react-native'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Checkbox,
  FormField,
  Muted,
  TextField,
  useThemedControlIconColor,
} from '@webonone/mobile-ui'
import { randomId } from '@/features/design/utils/randomId'
import type { FormField as FormFieldModel } from '@/shared/types/design.types'

export function FormDesignerPropsPanel({
  field,
  fieldIndex,
  fieldCount,
  onChange,
  onRemove,
  onMove,
}: {
  field: FormFieldModel | null
  fieldIndex: number
  fieldCount: number
  onChange: (field: FormFieldModel) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const iconColor = useThemedControlIconColor()

  if (!field) {
    return <Muted className="text-sm">{t('fieldPropertiesHint')}</Muted>
  }

  const needsOptions = field.type === 'radio' || field.type === 'select'

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-end gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={fieldIndex <= 0}
          onPress={() => onMove(-1)}
          accessibilityLabel={t('moveUp')}
        >
          <ArrowUp size={16} color={iconColor} strokeWidth={2} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={fieldIndex >= fieldCount - 1}
          onPress={() => onMove(1)}
          accessibilityLabel={t('moveDown')}
        >
          <ArrowDown size={16} color={iconColor} strokeWidth={2} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onPress={onRemove}
          accessibilityLabel={t('removeField')}
        >
          <Trash2 size={16} color={iconColor} strokeWidth={2} />
        </Button>
      </View>

      <Muted className="text-xs uppercase tracking-wide">{field.type}</Muted>

      <FormField label={t('label')} required>
        <TextField
          value={field.label}
          onChangeText={(label) => onChange({ ...field, label })}
        />
      </FormField>

      {field.type !== 'checkbox' ? (
        <FormField label={t('placeholder')}>
          <TextField
            value={field.placeholder ?? ''}
            onChangeText={(placeholder) => onChange({ ...field, placeholder })}
          />
        </FormField>
      ) : null}

      <Checkbox
        checked={Boolean(field.required)}
        onCheckedChange={(required) => onChange({ ...field, required })}
        label={tc('required')}
      />

      {needsOptions ? (
        <View className="gap-2">
          <Body className="text-sm font-medium">{t('options')}</Body>
          {(field.options ?? []).map((opt, index) => (
            <View key={opt.id} className="flex-row items-start gap-2">
              <View className="min-w-0 flex-1">
                <TextField
                  value={opt.label}
                  onChangeText={(label) => {
                    const options = [...(field.options ?? [])]
                    options[index] = { ...opt, label }
                    onChange({ ...field, options })
                  }}
                  accessibilityLabel={t('optionN', { n: index + 1 })}
                />
              </View>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={(field.options?.length ?? 0) <= 1}
                onPress={() => {
                  const options = (field.options ?? []).filter((item) => item.id !== opt.id)
                  onChange({ ...field, options })
                }}
                accessibilityLabel={t('removeOption', { n: index + 1 })}
              >
                <Trash2 size={16} color={iconColor} strokeWidth={2} />
              </Button>
            </View>
          ))}
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              const options = [
                ...(field.options ?? []),
                { id: randomId(8), label: t('optionN', { n: (field.options?.length ?? 0) + 1 }) },
              ]
              onChange({ ...field, options })
            }}
          >
            <Plus size={16} color={iconColor} strokeWidth={2} />
            <Body className="text-sm font-medium text-secondary">{t('addOption')}</Body>
          </Button>
        </View>
      ) : null}
    </View>
  )
}
