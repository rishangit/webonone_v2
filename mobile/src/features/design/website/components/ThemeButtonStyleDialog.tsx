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
import { nanoid } from '@/features/design/website/nanoid'
import { websiteButtonStyleSchema } from '@/features/design/website/schemas/websiteThemeSchemas'
import type { WebsiteButtonStyle, WebsiteTheme } from '@/features/design/website/types'

function borderWidthForColor(borderColorId: string, current: number): number {
  if (!borderColorId) return 0
  return current > 0 ? current : 1
}

export function ThemeButtonStyleDialog({
  open,
  theme,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  theme: WebsiteTheme
  initial?: WebsiteButtonStyle
  onOpenChange: (open: boolean) => void
  onSubmit: (style: WebsiteButtonStyle) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const isEdit = Boolean(initial)
  const [values, setValues] = useState<WebsiteButtonStyle>(() => emptyButtonStyle(theme, initial))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setValues(emptyButtonStyle(theme, initial))
    setFieldErrors({})
  }, [initial, open, theme])

  function submit() {
    const parsed = websiteButtonStyleSchema.safeParse(values)
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
      title={isEdit ? t('editButtonStyleTitle') : t('createButtonStyleTitle')}
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
        <FormField label={t('name')} required error={fieldErrors.name}>
          <TextField value={values.name} onChangeText={(name) => setValues({ ...values, name })} />
        </FormField>
        <FormField label={t('textStyle')}>
          <Select
            value={values.textStyleId || 'none'}
            onValueChange={(textStyleId) =>
              setValues({ ...values, textStyleId: textStyleId === 'none' ? '' : textStyleId })
            }
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value="none">{tc('none')}</SelectItem>
              {theme.textStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  {style.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('backgroundColor')}>
          <Select
            value={values.backgroundColorId || 'none'}
            onValueChange={(backgroundColorId) =>
              setValues({ ...values, backgroundColorId: backgroundColorId === 'none' ? '' : backgroundColorId })
            }
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
        <FormField label={t('fontColor')}>
          <Select
            value={values.textColorId || 'none'}
            onValueChange={(textColorId) =>
              setValues({ ...values, textColorId: textColorId === 'none' ? '' : textColorId })
            }
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
        <FormField label={t('borderColor')}>
          <Select
            value={values.borderColorId || 'none'}
            onValueChange={(borderColorId) =>
              setValues({
                ...values,
                borderColorId: borderColorId === 'none' ? '' : borderColorId,
                borderWidth: borderWidthForColor(borderColorId === 'none' ? '' : borderColorId, values.borderWidth),
              })
            }
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
        <FormField label={t('borderRadius')} error={fieldErrors.radius}>
          <TextField
            keyboardType="number-pad"
            value={String(values.radius)}
            onChangeText={(raw) => setValues({ ...values, radius: Number(raw) || 0 })}
          />
        </FormField>
      </View>
    </CustomDialog>
  )
}

function emptyButtonStyle(theme: WebsiteTheme, initial?: WebsiteButtonStyle): WebsiteButtonStyle {
  if (initial) return initial
  return {
    id: nanoid(8),
    name: '',
    backgroundColorId: theme.colors[0]?.id ?? '',
    textColorId: theme.colors[1]?.id ?? theme.colors[0]?.id ?? '',
    textStyleId: theme.textStyles[0]?.id ?? '',
    borderColorId: '',
    borderWidth: 0,
    radius: 6,
  }
}
