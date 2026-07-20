import { Text, TextInput, View, type TextInputProps } from 'react-native'

export interface TextFieldProps extends TextInputProps {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

export function TextField({ label, error, required, hint, ...props }: TextFieldProps) {
  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-medium text-foreground">
          {label}
          {required ? <Text className="text-destructive"> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#94A3B8"
        className={`rounded-lg border px-3 py-3 text-base text-foreground ${
          error ? 'border-destructive' : 'border-border'
        }`}
        {...props}
      />
      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-muted">{hint}</Text>
      ) : null}
    </View>
  )
}
