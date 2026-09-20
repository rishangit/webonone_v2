import { TextInput, View } from 'react-native'
import { cn } from '../lib/cn'
import {
  controlFieldInvalidClassName,
  controlGroupClassName,
  controlInGroupFieldClassName,
  controlTextInputProps,
} from '../lib/controlStyles'
import { isValidHexColor, normalizeHexColor } from '../lib/normalizeHexColor'
import { useThemeColors } from '../theme/ThemeProvider'
import { FormField } from './FormField'

export interface ColorInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  required?: boolean
  hint?: string
  disabled?: boolean
}

export function ColorInput({
  value,
  onChange,
  label,
  error,
  required,
  hint,
  disabled,
}: ColorInputProps) {
  const colors = useThemeColors()
  const swatch = isValidHexColor(value) ? normalizeHexColor(value) : colors.textMuted

  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <View
        className={cn(
          controlGroupClassName,
          error ? controlFieldInvalidClassName : undefined,
          disabled && 'opacity-50',
        )}
      >
        <View
          className="h-8 w-10 shrink-0 rounded-control border border-input-border"
          style={{ backgroundColor: swatch }}
        />
        <TextInput
          className={cn(controlInGroupFieldClassName, 'font-mono uppercase')}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          value={value}
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={onChange}
          placeholder="#RRGGBB"
          maxLength={7}
          {...controlTextInputProps()}
        />
      </View>
    </FormField>
  )
}
