import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { CustomDialog } from './CustomDialog'
import { Button } from './Button'
import { Body } from './Typography'
import { FormField } from './FormField'
import { cn } from '../lib/cn'
import {
  controlFieldInvalidClassName,
  controlGroupClassName,
  controlInGroupFieldClassName,
  controlTextInputProps,
} from '../lib/controlStyles'
import { useThemeColors } from '../theme/ThemeProvider'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

export type PhoneCountry = {
  iso2: string
  name: string
  dial: string
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso2: 'LK', name: 'Sri Lanka', dial: '+94' },
  { iso2: 'IN', name: 'India', dial: '+91' },
  { iso2: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso2: 'US', name: 'United States', dial: '+1' },
  { iso2: 'AU', name: 'Australia', dial: '+61' },
]

export function getPhoneCountryByIso2(iso2: string): PhoneCountry {
  return PHONE_COUNTRIES.find((country) => country.iso2 === iso2) ?? PHONE_COUNTRIES[0]!
}

export function formatPhoneE164(iso2: string, national: string): string {
  const digits = national.replace(/\D/g, '')
  if (!digits) return ''
  return `${getPhoneCountryByIso2(iso2).dial}${digits}`
}

export interface PhoneInputProps {
  country: string
  onCountryChange: (iso2: string) => void
  value: string
  onChangeText: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
}

export function PhoneInput({
  country,
  onCountryChange,
  value,
  onChangeText,
  label = 'Phone number',
  error,
  disabled,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const colors = useThemeColors()
  const iconColor = useThemedControlIconColor()
  const selected = getPhoneCountryByIso2(country)

  return (
    <>
      <FormField label={label} error={error}>
        <View
          className={cn(
            controlGroupClassName,
            error ? controlFieldInvalidClassName : undefined,
            disabled && 'opacity-50',
          )}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Country code"
            disabled={disabled}
            onPress={() => setOpen(true)}
            className="h-full flex-row items-center gap-1 border-r border-input-border py-2 pr-2"
          >
            <Text className="text-base leading-6 text-muted">{selected.dial}</Text>
            <ChevronDown size={18} color={iconColor} />
          </Pressable>
          <TextInput
            className={controlInGroupFieldClassName}
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            keyboardType="phone-pad"
            editable={!disabled}
            placeholder="771234567"
            {...controlTextInputProps()}
          />
        </View>
      </FormField>

      <CustomDialog
        open={open}
        onOpenChange={setOpen}
        title="Country"
        sizeWidth="medium"
        sizeHeight="auto"
        footer={
          <Button variant="outline" onPress={() => setOpen(false)}>
            Cancel
          </Button>
        }
      >
        <View className="gap-2">
          {PHONE_COUNTRIES.map((item) => (
            <Pressable
              key={item.iso2}
              onPress={() => {
                onCountryChange(item.iso2)
                setOpen(false)
              }}
              className={cn(
                'rounded-lg border px-3 py-3',
                item.iso2 === selected.iso2 ? 'border-primary bg-primary/10' : 'border-input-border',
              )}
            >
              <Body className="font-medium">
                {item.name} {item.dial}
              </Body>
            </Pressable>
          ))}
        </View>
      </CustomDialog>
    </>
  )
}
