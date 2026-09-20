import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Save } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  AppEndPanel,
  Button,
  FeatureScreen,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Spinner,
  Body,
  useThemeColors,
  useToast,
} from '@webonone/mobile-ui'
import { FormDesignerCanvas } from '@/features/design/components/FormDesignerCanvas'
import { FormDesignerPropsPanel } from '@/features/design/components/FormDesignerPropsPanel'
import { FormDesignerToolbox } from '@/features/design/components/FormDesignerToolbox'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { formDefinitionSchema } from '@/features/design/schemas/formSchemas'
import { formsListPath } from '@/features/design/utils/designPaths'
import { randomId } from '@/features/design/utils/randomId'
import { designAdminApi } from '@/shared/services/designAdminApi'
import type {
  FormDefinition,
  FormField,
  FormFieldType,
  FormTemplateStatus,
} from '@/shared/types/design.types'

function defaultField(type: FormFieldType, t: (key: string) => string): FormField {
  const field: FormField = {
    id: randomId(10),
    type,
    label:
      type === 'text'
        ? t('textField')
        : type === 'textarea'
          ? t('textArea')
          : type === 'checkbox'
            ? t('checkbox')
            : type === 'radio'
              ? t('radioGroup')
              : t('dropdown'),
    required: false,
  }
  if (type === 'radio' || type === 'select') {
    field.options = [
      { id: randomId(8), label: t('option1') },
      { id: randomId(8), label: t('option2') },
    ]
  }
  if (type === 'text' || type === 'textarea' || type === 'select') {
    field.placeholder = ''
  }
  return field
}

export function FormDesignerScreen({ formId }: { formId: string }) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const colors = useThemeColors()
  const { canManage, hasCompany } = useDesignPermissions()

  const [definition, setDefinition] = useState<FormDefinition>({ version: 1, fields: [] })
  const [name, setName] = useState('')
  const [status, setStatus] = useState<FormTemplateStatus>('draft')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [propsOpen, setPropsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!formId || !hasCompany) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    designAdminApi
      .getForm(formId)
      .then((form) => {
        if (cancelled) return
        setDefinition(form.definition ?? { version: 1, fields: [] })
        setName(form.name)
        setStatus(form.status)
        setSelectedId(null)
        setPropsOpen(false)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('unableToLoad'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [formId, hasCompany, t])

  const selectedField = useMemo(
    () => definition.fields.find((field) => field.id === selectedId) ?? null,
    [definition.fields, selectedId],
  )
  const selectedIndex = selectedField
    ? definition.fields.findIndex((field) => field.id === selectedField.id)
    : -1

  function goToList() {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(formsListPath())
  }

  function addField(type: FormFieldType) {
    const field = defaultField(type, t)
    setDefinition((prev) => ({ ...prev, fields: [...prev.fields, field] }))
    setSelectedId(field.id)
    setPropsOpen(true)
  }

  function closeFieldProps() {
    setPropsOpen(false)
    setSelectedId(null)
  }

  function updateField(next: FormField) {
    setDefinition((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => (field.id === next.id ? next : field)),
    }))
  }

  function removeField() {
    if (!selectedField) return
    setDefinition((prev) => {
      const fields = prev.fields.filter((field) => field.id !== selectedField.id)
      const nextId = fields[Math.max(0, selectedIndex - 1)]?.id ?? null
      setSelectedId(nextId)
      if (!nextId) setPropsOpen(false)
      return { ...prev, fields }
    })
  }

  function moveField(direction: -1 | 1) {
    if (selectedIndex < 0) return
    const target = selectedIndex + direction
    if (target < 0 || target >= definition.fields.length) return
    setDefinition((prev) => {
      const fields = [...prev.fields]
      const [item] = fields.splice(selectedIndex, 1)
      fields.splice(target, 0, item)
      return { ...prev, fields }
    })
  }

  async function handleSave() {
    const parsed = formDefinitionSchema.safeParse(definition)
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? t('invalidDefinition'))
      return
    }
    setLocalError(null)
    setSaving(true)
    try {
      const saved = await designAdminApi.updateForm(formId, {
        name,
        status,
        definition: parsed.data,
      })
      setDefinition(saved.definition)
      setName(saved.name)
      setStatus(saved.status)
      toast({ title: t('saved') })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('saveFailed')
      setLocalError(message)
      toast({
        title: t('saveFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!hasCompany) {
    return (
      <FeatureScreen
        title={t('designer')}
        description={t('companyTemplates')}
        onBack={goToList}
        backLabel={tc('back')}
      >
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  if (loading) {
    return (
      <FeatureScreen
        title={name || t('designer')}
        description={t('designerDescription')}
        onBack={goToList}
        backLabel={tc('back')}
      >
        <Spinner label={t('loadingForm')} />
      </FeatureScreen>
    )
  }

  if (error) {
    return (
      <FeatureScreen
        title={t('designer')}
        description={t('unableToLoad')}
        onBack={goToList}
        backLabel={tc('back')}
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={name || t('designer')}
      description={t('designerDescription')}
      onBack={goToList}
      backLabel={tc('back')}
      actions={
        canManage ? (
          <>
            <View className="w-36">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as FormTemplateStatus)}
              >
                <SelectTrigger />
                <SelectContent>
                  <SelectItem value="draft">{t('draft')}</SelectItem>
                  <SelectItem value="published">{t('published')}</SelectItem>
                </SelectContent>
              </Select>
            </View>
            <Button size="sm" onPress={() => void handleSave()} disabled={saving}>
              <Save size={16} color={colors.primaryText} strokeWidth={2} />
              <Body className="text-base font-medium text-primary-foreground">
                {saving ? t('saving') : tc('save')}
              </Body>
            </Button>
          </>
        ) : undefined
      }
    >
      {localError ? (
        <Alert variant="destructive">
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      ) : null}

      <View className="gap-4">
        <View className="rounded-lg border border-input-border bg-card p-3">
          <FormDesignerToolbox onAdd={addField} disabled={!canManage} />
        </View>
        <FormDesignerCanvas
          fields={definition.fields}
          selectedId={selectedId}
          canEdit={canManage}
          onSelect={setSelectedId}
          onEdit={(id) => {
            setSelectedId(id)
            setPropsOpen(true)
          }}
        />
      </View>

      <AppEndPanel
        open={propsOpen && canManage}
        onClose={closeFieldProps}
        title={t('fieldProperties')}
        closeLabel={tc('close')}
      >
        <FormDesignerPropsPanel
          field={selectedField}
          fieldIndex={selectedIndex}
          fieldCount={definition.fields.length}
          onChange={updateField}
          onRemove={removeField}
          onMove={moveField}
        />
      </AppEndPanel>
    </FeatureScreen>
  )
}
