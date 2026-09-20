import { TextInput, type TextInputProps } from 'react-native'
import { cn } from '../lib/cn'
import {
  controlFieldInvalidClassName,
  controlSurfaceClassName,
  controlTextInputProps,
} from '../lib/controlStyles'
import { useThemeColors } from '../theme/ThemeProvider'
import { FormField } from './FormField'

export interface TextareaProps extends TextInputProps {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

export function Textarea({
  label,
  error,
  required,
  hint,
  className,
  ...props
}: TextareaProps) {
  const colors = useThemeColors()
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline
        className={cn(controlSurfaceClassName, error ? controlFieldInvalidClassName : undefined, className)}
        {...controlTextInputProps(true)}
        {...props}
      />
    </FormField>
  )
}
