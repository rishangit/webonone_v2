import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import {
  formCreateMetaSchema,
  mapZodIssuesToFieldErrors,
  type FormCreateMetaValues,
} from '@/features/design/schemas/formSchemas'
import { slugify } from '@/features/design/utils/slugify'
import { designAdminApi } from '@/shared/services/designAdminApi'
import type { FormTemplate } from '@/shared/types/design.types'

const EMPTY: FormCreateMetaValues = { name: '', slug: '' }

export function FormCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (form: FormTemplate) => void
}) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [values, setValues] = useState<FormCreateMetaValues>({ ...EMPTY })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues({ ...EMPTY })
    setFieldErrors({})
    setSlugTouched(false)
    setError(null)
  }, [open])

  async function handleSubmit() {
    const parsed = formCreateMetaSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setError(null)
    setSaving(true)
    try {
      const created = await designAdminApi.createForm({
        name: parsed.data.name,
        slug: parsed.data.slug,
        definition: { version: 1, fields: [] },
        status: 'draft',
      })
      toast({ title: t('formCreated') })
      onOpenChange(false)
      onCreated?.(created)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('unableToLoad')
      setError(message)
      toast({
        title: t('saveFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createTitle')}
      description={t('createDescription')}
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
            {tc('cancel')}
          </Button>
          <Button onPress={() => void handleSubmit()} disabled={saving}>
            {saving ? t('creating') : t('create')}
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
        <FormField label={tc('name')} required error={fieldErrors.name}>
          <TextField
            value={values.name}
            onChangeText={(name) => {
              setValues((prev) => ({
                name,
                slug: slugTouched ? prev.slug : slugify(name),
              }))
            }}
            editable={!saving}
          />
        </FormField>
        <FormField label={t('slug')} required error={fieldErrors.slug}>
          <TextField
            value={values.slug}
            onChangeText={(slug) => {
              setSlugTouched(true)
              setValues((prev) => ({ ...prev, slug }))
            }}
            editable={!saving}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </FormField>
      </View>
    </CustomDialog>
  )
}
