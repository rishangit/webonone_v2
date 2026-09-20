import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  CustomDialog,
  DateField,
  FormField,
  Muted,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  TextField,
} from '@webonone/mobile-ui'
import { mapZodIssuesToFieldErrors } from '@/features/design/schemas/formSchemas'
import {
  ANALYTICS_DIMENSIONS,
  DATASET_FILTER_OPERATORS,
  DATASET_SOURCE_TYPES,
  createWebsiteDatasetSchema,
  defaultSelectedFields,
  emptyFilterRule,
  fieldsForSource,
  isDatasetSourceType,
  propertyTreeForSource,
  togglePropertySelection,
  type AnalyticsDimension,
  type CreateWebsiteDatasetValues,
  type DatasetSourceType,
} from '@/features/design/website/schemas/websiteDatasetSchemas'
import type { WebsiteDataset } from '@/features/design/website/types'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

const STEP_KEYS = ['basics', 'filters', 'properties', 'preview'] as const

function defaultDateRange() {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function valuesFromDataset(initial?: WebsiteDataset | null): CreateWebsiteDatasetValues {
  const sourceType = isDatasetSourceType(initial?.sourceType) ? initial.sourceType : 'products'
  const config = initial?.config ?? {}
  const dimension = ANALYTICS_DIMENSIONS.includes(config.dimension as AnalyticsDimension)
    ? (config.dimension as AnalyticsDimension)
    : 'kpis'
  return {
    name: initial?.name ?? '',
    sourceType,
    filters: {
      match: 'all',
      rules: (initial?.filters?.rules ?? []).map((rule) => ({
        field: rule.field,
        operator: (DATASET_FILTER_OPERATORS as readonly string[]).includes(rule.operator)
          ? (rule.operator as CreateWebsiteDatasetValues['filters']['rules'][number]['operator'])
          : 'eq',
        value: rule.value,
      })),
    },
    config:
      sourceType === 'analytics'
        ? { dimension, dateRange: config.dateRange ?? defaultDateRange() }
        : {},
    selectedFields: initial?.selectedFields?.length
      ? initial.selectedFields
      : defaultSelectedFields(sourceType, sourceType === 'analytics' ? { dimension } : {}),
    status: initial?.status ?? 'active',
  }
}

export function WebsiteDatasetDialog({
  open,
  isSaving,
  error,
  entityId,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  isSaving: boolean
  error: string | null
  entityId?: string
  initial?: WebsiteDataset | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateWebsiteDatasetValues) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const isEdit = Boolean(entityId)
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<CreateWebsiteDatasetValues>(valuesFromDataset())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewItems, setPreviewItems] = useState<Record<string, unknown>[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setValues(valuesFromDataset(initial))
    setFieldErrors({})
    setPreviewError(null)
    setPreviewItems([])
  }, [open, initial])

  const fields = fieldsForSource(values.sourceType as DatasetSourceType, values.config)
  const tree = useMemo(
    () => propertyTreeForSource(values.sourceType as DatasetSourceType, values.config),
    [values.sourceType, values.config],
  )
  const selected = new Set(values.selectedFields)
  const stepTitle = t(`datasetStep.${STEP_KEYS[step]}`)

  useEffect(() => {
    if (!open || step !== 3) return
    if (!entityId) {
      setPreviewItems([])
      setPreviewTotal(0)
      setPreviewError(t('datasetPreviewAfterSave'))
      return
    }
    let cancelled = false
    websiteAdminApi
      .previewDataset(entityId, { page: 1, pageSize: 12 })
      .then((result) => {
        if (cancelled) return
        setPreviewItems(result.items)
        setPreviewTotal(result.total)
        setPreviewError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setPreviewError(err instanceof Error ? err.message : t('datasetPreviewFailed'))
      })
    return () => {
      cancelled = true
    }
  }, [entityId, open, step, t])

  function validateCurrentStep(): boolean {
    if (step === 0) {
      if (!values.name.trim()) {
        setFieldErrors({ name: 'Name is required' })
        return false
      }
      if (values.sourceType === 'analytics' && !values.config?.dimension) {
        setFieldErrors({ dimension: t('datasetDimensionRequired') })
        return false
      }
      setFieldErrors({})
      return true
    }
    if (step === 2 && (!values.selectedFields || values.selectedFields.length === 0)) {
      setFieldErrors({ selectedFields: t('datasetPropertiesRequired') })
      return false
    }
    setFieldErrors({})
    return true
  }

  function handleNext() {
    if (!validateCurrentStep()) return
    if (step < 3) {
      setStep((current) => current + 1)
      return
    }
    const parsed = createWebsiteDatasetSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      setStep(0)
      return
    }
    onSubmit(parsed.data)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('editDatasetTitle') : t('createDatasetTitle')}
      description={isEdit ? undefined : t('createDatasetDescription')}
      sizeWidth="large"
      sizeHeight="xlarge"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={isSaving}>
            {tc('cancel')}
          </Button>
          {step > 0 ? (
            <Button variant="outline" onPress={() => setStep((current) => current - 1)} disabled={isSaving}>
              {tc('previous')}
            </Button>
          ) : null}
          <Button onPress={handleNext} disabled={isSaving}>
            {step < 3 ? tc('next') : isSaving ? t('saving') : isEdit ? tc('save') : t('create')}
          </Button>
        </>
      }
    >
      <View className="gap-4">
        <View className="gap-2">
          <Muted className="text-center text-xs font-medium uppercase tracking-wide">
            {t('datasetStepLabel', { current: step + 1, total: 4, title: stepTitle })}
          </Muted>
          <View className="mx-auto h-1.5 w-1/2 overflow-hidden rounded-full bg-border">
            <View className="h-full rounded-full bg-primary" style={{ width: `${((step + 1) / 4) * 100}%` }} />
          </View>
        </View>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === 0 ? (
          <View className="gap-4">
            <FormField label={t('datasetName')} required error={fieldErrors.name}>
              <TextField
                value={values.name}
                onChangeText={(name) => setValues((prev) => ({ ...prev, name }))}
                editable={!isSaving}
              />
            </FormField>
            <FormField label={t('datasetSourceType')} required>
              <Select
                value={values.sourceType}
                onValueChange={(sourceType) => {
                  const next = sourceType as DatasetSourceType
                  const config =
                    next === 'analytics'
                      ? { dimension: 'kpis' as AnalyticsDimension, dateRange: defaultDateRange() }
                      : {}
                  setValues((prev) => ({
                    ...prev,
                    sourceType: next,
                    config,
                    selectedFields: defaultSelectedFields(next, config),
                    filters: { match: 'all', rules: [] },
                  }))
                }}
              >
                <SelectTrigger />
                <SelectContent>
                  {DATASET_SOURCE_TYPES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {t(`datasetSource.${source}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            {values.sourceType === 'analytics' ? (
              <>
                <FormField label={t('datasetDimensionLabel')} required error={fieldErrors.dimension}>
                  <Select
                    value={values.config?.dimension ?? 'kpis'}
                    onValueChange={(dimension) =>
                      setValues((prev) => ({
                        ...prev,
                        config: { ...prev.config, dimension: dimension as AnalyticsDimension },
                        selectedFields: defaultSelectedFields('analytics', {
                          dimension: dimension as AnalyticsDimension,
                        }),
                      }))
                    }
                  >
                    <SelectTrigger />
                    <SelectContent>
                      {ANALYTICS_DIMENSIONS.map((dimension) => (
                        <SelectItem key={dimension} value={dimension}>
                          {t(`datasetDimensions.${dimension}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('datasetFrom')}>
                  <DateField
                    value={values.config?.dateRange?.from ? new Date(values.config.dateRange.from) : undefined}
                    onChange={(date) =>
                      setValues((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          dateRange: {
                            from: date ? date.toISOString().slice(0, 10) : defaultDateRange().from,
                            to: prev.config?.dateRange?.to ?? defaultDateRange().to,
                          },
                        },
                      }))
                    }
                  />
                </FormField>
                <FormField label={t('datasetTo')}>
                  <DateField
                    value={values.config?.dateRange?.to ? new Date(values.config.dateRange.to) : undefined}
                    onChange={(date) =>
                      setValues((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          dateRange: {
                            from: prev.config?.dateRange?.from ?? defaultDateRange().from,
                            to: date ? date.toISOString().slice(0, 10) : defaultDateRange().to,
                          },
                        },
                      }))
                    }
                  />
                </FormField>
              </>
            ) : null}
            <FormField label={t('datasetStatus')}>
              <Select
                value={values.status ?? 'active'}
                onValueChange={(status) =>
                  setValues((prev) => ({ ...prev, status: status as CreateWebsiteDatasetValues['status'] }))
                }
              >
                <SelectTrigger />
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="gap-4">
            {(values.filters?.rules ?? []).length === 0 ? (
              <Muted>{t('datasetNoRules')}</Muted>
            ) : (
              (values.filters?.rules ?? []).map((rule, index) => (
                <View key={`${rule.field}-${index}`} className="gap-2 rounded-lg border border-border p-3">
                  <FormField label={t('datasetField')}>
                    <Select
                      value={rule.field}
                      onValueChange={(field) =>
                        setValues((prev) => {
                          const rules = [...(prev.filters?.rules ?? [])]
                          rules[index] = { ...rules[index]!, field }
                          return { ...prev, filters: { match: 'all', rules } }
                        })
                      }
                    >
                      <SelectTrigger />
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.field} value={field.field}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={t('datasetValue')}>
                    <TextField
                      value={String(rule.value ?? '')}
                      onChangeText={(value) =>
                        setValues((prev) => {
                          const rules = [...(prev.filters?.rules ?? [])]
                          rules[index] = { ...rules[index]!, value }
                          return { ...prev, filters: { match: 'all', rules } }
                        })
                      }
                    />
                  </FormField>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      setValues((prev) => ({
                        ...prev,
                        filters: {
                          match: 'all',
                          rules: (prev.filters?.rules ?? []).filter((_, ruleIndex) => ruleIndex !== index),
                        },
                      }))
                    }
                  >
                    {t('datasetRemoveRule')}
                  </Button>
                </View>
              ))
            )}
            <Button
              variant="outline"
              onPress={() =>
                setValues((prev) => ({
                  ...prev,
                  filters: {
                    match: 'all',
                    rules: [...(prev.filters?.rules ?? []), emptyFilterRule(fields[0]?.field ?? 'name')],
                  },
                }))
              }
            >
              {t('datasetAddRule')}
            </Button>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-3">
            {fieldErrors.selectedFields ? (
              <Alert variant="destructive">
                <AlertDescription>{fieldErrors.selectedFields}</AlertDescription>
              </Alert>
            ) : null}
            <Muted>{t('datasetPropertiesHelp')}</Muted>
            {tree.map((node) => (
              <Checkbox
                key={node.path}
                checked={selected.has(node.path)}
                label={node.label}
                onCheckedChange={(checked) =>
                  setValues((prev) => ({
                    ...prev,
                    selectedFields: togglePropertySelection(prev.selectedFields, node, checked),
                  }))
                }
              />
            ))}
          </View>
        ) : null}

        {step === 3 ? (
          <View className="gap-3">
            {previewError ? <Muted>{previewError}</Muted> : null}
            <Muted>{t('datasetPropertiesCount', { count: values.selectedFields.length })}</Muted>
            {previewItems.slice(0, 8).map((item, index) => (
              <Muted key={index}>{String(item.name ?? item.label ?? item.id ?? JSON.stringify(item))}</Muted>
            ))}
            {previewTotal > 0 ? <Muted>{t('datasetPreviewCount', { count: previewTotal })}</Muted> : null}
          </View>
        ) : null}
      </View>
    </CustomDialog>
  )
}
