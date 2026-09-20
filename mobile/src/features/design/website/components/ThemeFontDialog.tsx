import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button, CustomDialog, FormField, TextField } from '@webonone/mobile-ui'
import { mapZodIssuesToFieldErrors } from '@/features/design/schemas/formSchemas'
import { nanoid } from '@/features/design/website/nanoid'
import { websiteFontTokenSchema } from '@/features/design/website/schemas/websiteThemeSchemas'
import type { WebsiteFontToken } from '@/features/design/website/types'
import {
  normalizeGoogleFontInput,
  parseGoogleFontFamily,
} from '@/features/design/website/utils/parseGoogleFontFamily'

export function ThemeFontDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  initial?: WebsiteFontToken
  onOpenChange: (open: boolean) => void
  onSubmit: (font: WebsiteFontToken) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const isEdit = Boolean(initial)
  const [name, setName] = useState('')
  const [googleFontUrl, setGoogleFontUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setGoogleFontUrl(initial?.googleFontUrl ?? '')
    setFieldErrors({})
  }, [initial, open])

  const family = parseGoogleFontFamily(googleFontUrl) ?? initial?.family ?? ''

  function submit() {
    const url = normalizeGoogleFontInput(googleFontUrl)
    const parsedFamily = parseGoogleFontFamily(url) ?? ''
    const parsed = websiteFontTokenSchema.safeParse({
      id: initial?.id ?? nanoid(8),
      name: name.trim() || parsedFamily,
      googleFontUrl: url,
      family: parsedFamily,
    })
    if (!parsed.success) {
      const errors = mapZodIssuesToFieldErrors(parsed.error.issues)
      if (errors.googleFontUrl === 'Enter a valid Google Font URL') {
        errors.googleFontUrl = t('invalidGoogleFontUrl')
      }
      setFieldErrors(errors)
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
      title={isEdit ? t('editFontTitle') : t('createFontTitle')}
      sizeWidth="medium"
      sizeHeight="auto"
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
          <TextField value={name} onChangeText={setName} />
        </FormField>
        <FormField
          label={t('googleFontUrl')}
          required
          error={fieldErrors.googleFontUrl}
          hint={t('googleFontUrlHint')}
        >
          <TextField
            value={googleFontUrl}
            onChangeText={setGoogleFontUrl}
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => setGoogleFontUrl((current) => normalizeGoogleFontInput(current))}
          />
        </FormField>
        <FormField label={t('fontFamily')} error={fieldErrors.family}>
          <TextField value={family} editable={false} />
        </FormField>
      </View>
    </CustomDialog>
  )
}
