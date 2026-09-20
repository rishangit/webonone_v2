import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  TextField,
} from '@webonone/mobile-ui'
import {
  mapZodIssuesToFieldErrors,
} from '@/features/design/schemas/formSchemas'
import {
  pageMetaSchema,
  slugifyPath,
  type PageMetaValues,
} from '@/features/design/website/schemas/websiteMeta'
import type { WebsiteLayout } from '@/features/design/website/types'

const EMPTY: PageMetaValues = { name: '', path: '', status: 'active', layoutId: null }

export function WebsitePageDialog({
  open,
  isSaving,
  error,
  initial,
  layouts,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  isSaving: boolean
  error: string | null
  initial?: PageMetaValues
  layouts: WebsiteLayout[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PageMetaValues) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const isEdit = Boolean(initial)
  const defaultLayoutId = layouts.find((item) => item.isDefault)?.id ?? layouts[0]?.id ?? null
  const [values, setValues] = useState<PageMetaValues>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [pathTouched, setPathTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(
      initial ?? { name: '', path: '', status: 'active', layoutId: defaultLayoutId },
    )
    setFieldErrors({})
    setPathTouched(Boolean(initial))
  }, [open, initial, defaultLayoutId])

  function submit() {
    const parsed = pageMetaSchema.safeParse(values)
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
      title={isEdit ? t('editPageTitle') : t('createPageTitle')}
      description={isEdit ? undefined : t('createPageDescription')}
      sizeWidth="medium"
      sizeHeight="auto"
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
            onChangeText={(name) => {
              setValues((prev) => ({
                ...prev,
                name,
                path: pathTouched ? prev.path : slugifyPath(name),
              }))
            }}
            editable={!isSaving}
          />
        </FormField>
        <FormField label={t('path')} error={fieldErrors.path} hint={t('pathHint')}>
          <TextField
            value={values.path}
            onChangeText={(path) => {
              setPathTouched(true)
              setValues((prev) => ({ ...prev, path }))
            }}
            editable={!isSaving}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </FormField>
        <FormField label={t('status')}>
          <Select
            value={values.status}
            onValueChange={(status) =>
              setValues((prev) => ({ ...prev, status: status as PageMetaValues['status'] }))
            }
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        {layouts.length > 0 ? (
          <FormField label={t('layout')} required>
            <Select
              value={values.layoutId || defaultLayoutId || ''}
              onValueChange={(layoutId) => setValues((prev) => ({ ...prev, layoutId }))}
            >
              <SelectTrigger />
              <SelectContent>
                {layouts.map((layout) => (
                  <SelectItem key={layout.id} value={layout.id}>
                    {layout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}
      </View>
    </CustomDialog>
  )
}
