import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  TextField,
} from '@webonone/mobile-ui'
import { mapZodIssuesToFieldErrors } from '@/features/design/schemas/formSchemas'
import { defaultSizeByBreakpoint, SIZE_LABEL_KEYS } from '@/features/design/website/components/textStyleDefaults'
import { fallbackTextSize } from '@/features/design/website/document/theme'
import { nanoid } from '@/features/design/website/nanoid'
import { websiteTextStyleSchema } from '@/features/design/website/schemas/websiteThemeSchemas'
import { WEBSITE_BREAKPOINTS, type WebsiteTextStyle, type WebsiteTheme } from '@/features/design/website/types'

export function ThemeTextStyleDialog({
  open,
  theme,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  theme: WebsiteTheme
  initial?: WebsiteTextStyle
  onOpenChange: (open: boolean) => void
  onSubmit: (style: WebsiteTextStyle) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const isEdit = Boolean(initial)
  const [values, setValues] = useState<WebsiteTextStyle>(() => emptyTextStyle(theme, initial))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setValues(emptyTextStyle(theme, initial))
    setFieldErrors({})
  }, [initial, open, theme])

  function submit() {
    const parsed = websiteTextStyleSchema.safeParse({
      ...values,
      size: fallbackTextSize(values.sizeByBreakpoint),
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('editTextStyleTitle') : t('createTextStyleTitle')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onPress={submit}>{isEdit ? tc('save') : t('create')}</Button>
        </>
      }
    >
      <View className="gap-4">
        <FormField label={t('styleName')} required error={fieldErrors.name}>
          <TextField value={values.name} onChangeText={(name) => setValues({ ...values, name })} />
        </FormField>
        <FormField label={t('fontType')}>
          <Select
            value={values.fontId || 'none'}
            onValueChange={(fontId) => setValues({ ...values, fontId: fontId === 'none' ? '' : fontId })}
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value="none">{tc('none')}</SelectItem>
              {theme.fonts.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  {font.name || font.family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('fontColor')}>
          <Select
            value={values.colorId || 'none'}
            onValueChange={(colorId) => setValues({ ...values, colorId: colorId === 'none' ? '' : colorId })}
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value="none">{tc('none')}</SelectItem>
              {theme.colors.map((color) => (
                <SelectItem key={color.id} value={color.id}>
                  {color.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        {WEBSITE_BREAKPOINTS.map((breakpoint) => (
          <FormField
            key={breakpoint}
            label={t(SIZE_LABEL_KEYS[breakpoint])}
            error={fieldErrors[`sizeByBreakpoint.${breakpoint}`]}
          >
            <TextField
              keyboardType="number-pad"
              value={String(values.sizeByBreakpoint?.[breakpoint] ?? values.size)}
              onChangeText={(raw) => {
                const sizeByBreakpoint = {
                  ...defaultSizeByBreakpoint(values.size),
                  ...values.sizeByBreakpoint,
                  [breakpoint]: Number(raw) || 16,
                }
                setValues({
                  ...values,
                  sizeByBreakpoint,
                  size: fallbackTextSize(sizeByBreakpoint),
                })
              }}
            />
          </FormField>
        ))}
      </View>
    </CustomDialog>
  )
}

function emptyTextStyle(theme: WebsiteTheme, initial?: WebsiteTextStyle): WebsiteTextStyle {
  if (initial) {
    return {
      ...initial,
      sizeByBreakpoint: {
        ...defaultSizeByBreakpoint(initial.size),
        ...initial.sizeByBreakpoint,
      },
    }
  }
  const sizeByBreakpoint = defaultSizeByBreakpoint(16)
  return {
    id: nanoid(8),
    name: '',
    fontId: theme.fonts[0]?.id ?? '',
    size: fallbackTextSize(sizeByBreakpoint),
    sizeByBreakpoint,
    colorId: theme.colors[0]?.id ?? '',
  }
}
