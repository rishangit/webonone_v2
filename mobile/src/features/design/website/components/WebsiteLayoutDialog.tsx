import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  CustomDialog,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  TextField,
} from '@webonone/mobile-ui'
import { mapZodIssuesToFieldErrors } from '@/features/design/schemas/formSchemas'
import { layoutMetaSchema, type LayoutMetaValues } from '@/features/design/website/schemas/websiteMeta'
import type { WebsiteChrome, WebsiteTheme } from '@/features/design/website/types'

const NONE = '__none'

export function WebsiteLayoutDialog({
  open,
  isSaving,
  error,
  initial,
  headers,
  footers,
  themes,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  isSaving: boolean
  error: string | null
  initial?: LayoutMetaValues
  headers: WebsiteChrome[]
  footers: WebsiteChrome[]
  themes: WebsiteTheme[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LayoutMetaValues) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const isEdit = Boolean(initial)
  const defaultThemeId = themes.find((item) => item.isDefault)?.id ?? themes[0]?.id ?? null
  const [values, setValues] = useState<LayoutMetaValues>({
    name: '',
    headerId: null,
    footerId: null,
    themeId: defaultThemeId,
    isDefault: false,
    pageIds: [],
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setValues(
      initial ?? {
        name: '',
        headerId: null,
        footerId: null,
        themeId: defaultThemeId,
        isDefault: false,
        pageIds: [],
      },
    )
    setFieldErrors({})
  }, [open, initial, defaultThemeId])

  function submit() {
    const parsed = layoutMetaSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('editLayoutTitle') : t('createLayoutTitle')}
      description={isEdit ? t('editLayoutDescription') : t('createLayoutDescription')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={isSaving}>
            {tc('cancel')}
          </Button>
          <Button onPress={submit} disabled={isSaving}>
            {isSaving ? (isEdit ? t('saving') : t('creating')) : isEdit ? tc('save') : t('create')}
          </Button>
        </>
      }
    >
      <View className="gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FormField label={t('name')} required error={fieldErrors.name}>
          <TextField
            value={values.name}
            onChangeText={(name) => setValues((prev) => ({ ...prev, name }))}
            editable={!isSaving}
          />
        </FormField>
        <FormField label={t('header')}>
          <Select
            value={values.headerId || NONE}
            onValueChange={(value) =>
              setValues((prev) => ({ ...prev, headerId: value === NONE ? null : value }))
            }
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value={NONE}>{tc('none')}</SelectItem>
              {headers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('footer')}>
          <Select
            value={values.footerId || NONE}
            onValueChange={(value) =>
              setValues((prev) => ({ ...prev, footerId: value === NONE ? null : value }))
            }
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value={NONE}>{tc('none')}</SelectItem>
              {footers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('theme')}>
          <Select
            value={values.themeId || NONE}
            onValueChange={(value) =>
              setValues((prev) => ({ ...prev, themeId: value === NONE ? null : value }))
            }
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value={NONE}>{tc('none')}</SelectItem>
              {themes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <Checkbox
          checked={Boolean(values.isDefault)}
          onCheckedChange={(isDefault) => setValues((prev) => ({ ...prev, isDefault }))}
          disabled={isSaving}
          label={t('setDefault')}
        />
      </View>
    </CustomDialog>
  )
}
