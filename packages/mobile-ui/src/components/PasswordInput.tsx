import { useState } from 'react'
import { Pressable, TextInput, View, type TextInputProps } from 'react-native'
import { Eye, EyeOff, Lock } from 'lucide-react-native'
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

export interface PasswordInputProps extends TextInputProps {
  label?: string
  error?: string
  required?: boolean
  hint?: string
  showToggle?: boolean
  withIcon?: boolean
}

export function PasswordInput({
  label,
  error,
  required,
  hint,
  showToggle = true,
  withIcon = false,
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const colors = useThemeColors()
  const iconColor = useThemedControlIconColor()

  const input = (
    <TextInput
      placeholderTextColor={colors.textMuted}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      className={
        showToggle || withIcon
          ? cn(controlInGroupFieldClassName, className)
          : controlFieldClass(error, className)
      }
      {...controlTextInputProps()}
      {...props}
    />
  )

  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      {showToggle || withIcon ? (
        <View className={cn(controlGroupClassName, error ? controlFieldInvalidClassName : undefined)}>
          {withIcon ? <Lock size={16} color={iconColor} strokeWidth={2} /> : null}
          {input}
          {showToggle ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visible ? 'Hide password' : 'Show password'}
              onPress={() => setVisible((current) => !current)}
              className="h-10 w-10 items-center justify-center"
            >
              {visible ? <EyeOff size={20} color={iconColor} /> : <Eye size={20} color={iconColor} />}
            </Pressable>
          ) : null}
        </View>
      ) : (
        input
      )}
    </FormField>
  )
}
