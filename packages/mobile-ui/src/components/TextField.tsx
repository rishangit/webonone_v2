import { TextInput, View, type TextInputProps } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { cn } from '../lib/cn'
import {
  controlFieldClass,
  controlFieldInvalidClassName,
  controlGroupClassName,
  controlInGroupFieldClassName,
  controlTextInputProps,
} from '../lib/controlStyles'
import { useThemeColors } from '../theme/ThemeProvider'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { FormField } from './FormField'

export interface TextFieldProps extends TextInputProps {
  label?: string
  error?: string
  required?: boolean
  hint?: string
  leadingIcon?: LucideIcon
}

export function TextField({
  label,
  error,
  required,
  hint,
  leadingIcon: LeadingIcon,
  className,
  ...props
}: TextFieldProps) {
  const colors = useThemeColors()
  const iconColor = useThemedControlIconColor()

  const input = (
    <TextInput
      placeholderTextColor={colors.textMuted}
      className={LeadingIcon ? cn(controlInGroupFieldClassName, className) : controlFieldClass(error, className)}
      {...controlTextInputProps()}
      {...props}
    />
  )

  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      {LeadingIcon ? (
        <View className={cn(controlGroupClassName, error ? controlFieldInvalidClassName : undefined)}>
          <LeadingIcon size={16} color={iconColor} strokeWidth={2} />
          {input}
        </View>
      ) : (
        input
      )}
    </FormField>
  )
}
