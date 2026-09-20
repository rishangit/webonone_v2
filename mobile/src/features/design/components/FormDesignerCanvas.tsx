import { Pressable, View } from 'react-native'
import { Edit3 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Checkbox,
  Label,
  Muted,
  NativeSelect,
  RadioGroup,
  RadioGroupItem,
  Textarea,
  TextField,
  cn,
  useThemedControlIconColor,
} from '@webonone/mobile-ui'
import type { FormField } from '@/shared/types/design.types'

function FieldPreview({ field }: { field: FormField }) {
  const { t } = useTranslation('forms')

  switch (field.type) {
    case 'text':
      return (
        <TextField
          label={field.label}
          required={field.required}
          editable={false}
          placeholder={field.placeholder || t('placeholderText')}
        />
      )
    case 'textarea':
      return (
        <Textarea
          label={field.label}
          required={field.required}
          editable={false}
          placeholder={field.placeholder || t('placeholderLong')}
          numberOfLines={3}
        />
      )
    case 'checkbox':
      return (
        <View className="flex-row items-center gap-2">
          <Checkbox checked={false} disabled onCheckedChange={() => undefined} />
          <Label required={field.required}>{field.label}</Label>
        </View>
      )
    case 'radio':
      return (
        <View className="gap-2">
          <Label required={field.required}>{field.label}</Label>
          <RadioGroup value="" onValueChange={() => undefined} disabled>
            {(field.options ?? []).map((opt) => (
              <RadioGroupItem key={opt.id} value={opt.id} label={opt.label} disabled />
            ))}
          </RadioGroup>
        </View>
      )
    case 'select':
      return (
        <NativeSelect
          label={field.label}
          required={field.required}
          value=""
          onValueChange={() => undefined}
          disabled
          allowEmpty
          placeholder={field.placeholder || t('selectPlaceholder')}
          options={(field.options ?? []).map((opt) => ({ value: opt.id, label: opt.label }))}
        />
      )
    default:
      return null
  }
}

export function FormDesignerCanvas({
  fields,
  selectedId,
  canEdit,
  onSelect,
  onEdit,
}: {
  fields: FormField[]
  selectedId: string | null
  canEdit?: boolean
  onSelect: (id: string) => void
  onEdit: (id: string) => void
}) {
  const { t } = useTranslation('forms')
  const iconColor = useThemedControlIconColor()

  if (fields.length === 0) {
    return (
      <View className="min-h-[240px] items-center justify-center rounded-lg border border-dashed border-input-border p-6">
        <Muted className="text-center text-sm">{t('canvasEmpty')}</Muted>
      </View>
    )
  }

  return (
    <View className="gap-3">
      {fields.map((field) => {
        const selected = selectedId === field.id
        const className = cn(
          'relative w-full rounded-lg border bg-card p-4',
          selected ? 'border-primary' : 'border-input-border',
          selected && canEdit && 'pr-14',
        )

        const body = (
          <>
            {canEdit && selected ? (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-2 h-9 w-9 rounded-full p-0"
                accessibilityLabel={t('editField', { name: field.label })}
                onPress={() => onEdit(field.id)}
              >
                <Edit3 size={16} color={iconColor} strokeWidth={2} />
              </Button>
            ) : null}
            <FieldPreview field={field} />
          </>
        )

        if (!canEdit) {
          return (
            <View key={field.id} className={className}>
              {body}
            </View>
          )
        }

        return (
          <Pressable
            key={field.id}
            accessibilityRole="button"
            onPress={() => onSelect(field.id)}
            className={className}
          >
            {body}
          </Pressable>
        )
      })}
    </View>
  )
}
