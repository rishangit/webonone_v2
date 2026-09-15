import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  DatePicker,
  Form,
  FormField,
  ImagePreview,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  itemListRowBodyClassName,
  itemListThumbClassName,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteApi, type DatasetFieldCatalog } from '../api'
import { DatasetFilterBuilder } from './DatasetFilterBuilder'
import { DatasetPropertyTreeSelect } from './DatasetPropertyTreeSelect'
import {
  ANALYTICS_DIMENSIONS,
  DATASET_SOURCE_TYPES,
  createWebsiteDatasetSchema,
  defaultSelectedFields,
  fieldsForSource,
  isDatasetSourceType,
  propertyTreeForSource,
  resolveSelectedFields,
  type AnalyticsDimension,
  type CreateWebsiteDatasetValues,
  type DatasetConfig,
  type DatasetFilterRule,
  type DatasetSourceType,
} from '../schemas/websiteDatasetSchemas'
import type { WebsiteDataset } from '../types'

export const WEBSITE_DATASET_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

const STEP_TITLES = ['basics', 'filters', 'properties', 'preview'] as const

function defaultDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function parseYmd(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

function toYmd(date: Date | undefined): string | undefined {
  if (!date) return undefined
  return date.toISOString().slice(0, 10)
}

function emptyValues(): CreateWebsiteDatasetValues {
  return {
    name: '',
    sourceType: 'products',
    filters: { match: 'all', rules: [] },
    config: {},
    selectedFields: defaultSelectedFields('products'),
    status: 'active',
  }
}

function fromDataset(item: WebsiteDataset): CreateWebsiteDatasetValues {
  const sourceType = isDatasetSourceType(item.sourceType) ? item.sourceType : 'products'
  const config = (item.config ?? {}) as DatasetConfig
  return {
    name: item.name,
    sourceType,
    filters: {
      match: 'all',
      rules: (item.filters?.rules ?? []) as DatasetFilterRule[],
    },
    config,
    selectedFields: resolveSelectedFields(sourceType, item.selectedFields, config),
    status: item.status,
  }
}

interface WebsiteDatasetDialogProps {
  open: boolean
  isSaving: boolean
  error: string | null
  entityId?: string
  initial?: WebsiteDataset | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateWebsiteDatasetValues) => void
  onHostedSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function WebsiteDatasetDialog({
  open,
  isSaving,
  error,
  entityId,
  initial,
  onOpenChange,
  onSubmit,
  onHostedSaved,
  chrome = 'dialog',
}: WebsiteDatasetDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial || entityId)
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<CreateWebsiteDatasetValues>(emptyValues())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [catalog, setCatalog] = useState<DatasetFieldCatalog | null>(null)
  const [previewItems, setPreviewItems] = useState<Record<string, unknown>[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: entityId
      ? `/embed/dialogs/website/datasets/${entityId}`
      : '/embed/dialogs/website/datasets/create',
    title: isEdit ? t('editDatasetTitle') : t('createDatasetTitle'),
    description: isEdit ? undefined : t('createDatasetDescription'),
    submitLabel: isEdit ? tc('save') : t('create'),
    secondaryLabel: step > 0 ? tc('previous') : undefined,
    ...WEBSITE_DATASET_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onHostedSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setFieldErrors({})
    setStep(0)
    setPreviewItems([])
    setPreviewTotal(0)
    setPreviewError(null)

    let cancelled = false

    async function loadValues() {
      if (entityId) {
        try {
          const item = await websiteApi.getDataset(entityId)
          if (!cancelled) setValues(fromDataset(item))
          return
        } catch {
          // Fall back to the list row when detail fetch fails.
        }
      }
      if (!cancelled) setValues(initial ? fromDataset(initial) : emptyValues())
    }

    void loadValues()
    return () => {
      cancelled = true
    }
  }, [open, chrome, entityId, initial])

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    void websiteApi
      .getDatasetFieldCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(null))
  }, [open, chrome])

  const fields = fieldsForSource(values.sourceType as DatasetSourceType, values.config)
  const stepTitleKey = STEP_TITLES[step]
  const stepLabel = t(`datasetStep.${stepTitleKey}`)

  async function loadPreview() {
    if (!entityId) {
      setPreviewItems([])
      setPreviewTotal(0)
      setPreviewError(t('datasetPreviewAfterSave'))
      return
    }
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const result = await websiteApi.previewDataset(entityId, { page: 1, pageSize: 12 })
      setPreviewItems(result.items)
      setPreviewTotal(result.total)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : t('datasetPreviewFailed'))
      setPreviewItems([])
      setPreviewTotal(0)
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    if (step === 3) void loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when entering preview step
  }, [step, entityId])

  function validateCurrentStep(): boolean {
    if (step === 0) {
      if (!values.name.trim()) {
        setFieldErrors({ name: t('datasetName') + ' is required' })
        return false
      }
      if (values.sourceType === 'analytics' && !values.config?.dimension) {
        setFieldErrors({ 'config.dimension': t('datasetDimensionRequired') })
        return false
      }
      setFieldErrors({})
      return true
    }
    if (step === 2) {
      if (!values.selectedFields || values.selectedFields.length === 0) {
        setFieldErrors({ selectedFields: t('datasetPropertiesRequired') })
        return false
      }
      setFieldErrors({})
      return true
    }
    setFieldErrors({})
    return true
  }

  function handleSubmit() {
    const parsed = createWebsiteDatasetSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      const issuePaths = parsed.error.issues.map((issue) => issue.path[0])
      if (issuePaths.includes('selectedFields')) setStep(2)
      else setStep(0)
      return
    }
    onSubmit(parsed.data)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (step < 3) {
        if (!validateCurrentStep()) return
        setStep((s) => s + 1)
        return
      }
      handleSubmit()
    },
    onSecondary: () => {
      if (step > 0) setStep((s) => s - 1)
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      isSaving,
      step < 3 ? tc('next') : isEdit ? tc('save') : t('create'),
      { secondaryLabel: step > 0 ? tc('previous') : null },
    )
  }, [chrome, dialogRequestId, isEdit, isSaving, parentOrigin, step, t, tc])

  if (chrome === 'dialog' && isHosted) return null

  const isPreviewStep = step === 3
  const propertyNodes = propertyTreeForSource(
    values.sourceType as DatasetSourceType,
    values.config,
  )

  const body = (
    <Form
      className={
        isPreviewStep ? 'flex h-full min-h-0 flex-1 flex-col gap-4' : 'space-y-4'
      }
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="shrink-0 space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('datasetStepLabel', { current: step + 1, total: 4, title: stepLabel })}
        </p>
        <div className="mx-auto h-1.5 w-1/2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {step === 0 ? (
        <div className="space-y-4">
          <FormField label={t('datasetName')} htmlFor="dataset-name" required error={fieldErrors.name}>
            <Input
              id="dataset-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </FormField>
          <FormField
            label={t('datasetSourceType')}
            htmlFor="dataset-source"
            required
            error={fieldErrors.sourceType}
          >
            <Select
              value={values.sourceType}
              onValueChange={(value) => {
                if (!value || !isDatasetSourceType(value) || value === values.sourceType) return
                setValues((v) => {
                  const sourceType = value
                  const config =
                    sourceType === 'analytics'
                      ? { dimension: 'kpis' as AnalyticsDimension, dateRange: defaultDateRange() }
                      : {}
                  return {
                    ...v,
                    sourceType,
                    filters: { match: 'all', rules: [] },
                    config,
                    selectedFields: defaultSelectedFields(sourceType, config),
                  }
                })
              }}
            >
              <SelectTrigger id="dataset-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATASET_SOURCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`datasetSource.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={t('datasetStatus')} htmlFor="dataset-status">
            <Select
              value={values.status}
              onValueChange={(value) =>
                setValues((v) => ({ ...v, status: value as 'active' | 'inactive' }))
              }
            >
              <SelectTrigger id="dataset-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {values.sourceType === 'analytics' ? (
            <>
              <FormField
                label={t('datasetDimensionLabel')}
                htmlFor="dataset-dimension"
                required
                error={fieldErrors['config.dimension']}
              >
                <Select
                  value={values.config?.dimension ?? 'kpis'}
                  onValueChange={(value) => {
                    const currentDimension = values.config?.dimension ?? 'kpis'
                    if (!value || value === currentDimension) return
                    setValues((v) => {
                      const config = {
                        ...v.config,
                        dimension: value as AnalyticsDimension,
                        dateRange: v.config?.dateRange ?? defaultDateRange(),
                      }
                      return {
                        ...v,
                        config,
                        filters: { match: 'all', rules: [] },
                        selectedFields: defaultSelectedFields('analytics', config),
                      }
                    })
                  }}
                >
                  <SelectTrigger id="dataset-dimension">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(catalog?.analyticsDimensions ?? ANALYTICS_DIMENSIONS).map((dim) => (
                      <SelectItem key={dim} value={dim}>
                        {t(`datasetDimensions.${dim}`, { defaultValue: dim })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label={t('datasetFrom')} htmlFor="dataset-from">
                  <DatePicker
                    id="dataset-from"
                    withIcon
                    value={parseYmd(values.config?.dateRange?.from)}
                    onChange={(date) =>
                      setValues((v) => ({
                        ...v,
                        config: {
                          ...v.config,
                          dateRange: {
                            from: toYmd(date) ?? defaultDateRange().from,
                            to: v.config?.dateRange?.to ?? defaultDateRange().to,
                          },
                        },
                      }))
                    }
                  />
                </FormField>
                <FormField label={t('datasetTo')} htmlFor="dataset-to">
                  <DatePicker
                    id="dataset-to"
                    withIcon
                    value={parseYmd(values.config?.dateRange?.to)}
                    onChange={(date) =>
                      setValues((v) => ({
                        ...v,
                        config: {
                          ...v.config,
                          dateRange: {
                            from: v.config?.dateRange?.from ?? defaultDateRange().from,
                            to: toYmd(date) ?? defaultDateRange().to,
                          },
                        },
                      }))
                    }
                  />
                </FormField>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {step === 1 ? (
        <DatasetFilterBuilder
          fields={fields}
          rules={values.filters.rules}
          onChange={(rules) => setValues((v) => ({ ...v, filters: { match: 'all', rules } }))}
        />
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('datasetPropertiesHelp')}</p>
          <FormField
            label={t('datasetProperties')}
            htmlFor="dataset-properties"
            required
            error={fieldErrors.selectedFields}
          >
            <DatasetPropertyTreeSelect
              nodes={propertyNodes}
              value={values.selectedFields ?? []}
              onChange={(selectedFields) => setValues((v) => ({ ...v, selectedFields }))}
            />
          </FormField>
        </div>
      ) : null}

      {isPreviewStep ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {previewLoading ? (
            <p className="shrink-0 text-sm text-muted-foreground">{t('datasetPreviewLoading')}</p>
          ) : null}
          {previewError ? (
            <Alert className="shrink-0">
              <AlertDescription>{previewError}</AlertDescription>
            </Alert>
          ) : null}
          {!previewLoading && !previewError ? (
            <p className="shrink-0 text-sm text-muted-foreground">
              {t('datasetPreviewCount', { count: previewTotal })}
            </p>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scrollbar-themed">
            {!previewLoading && !previewError && previewItems.length === 0 ? (
              <ItemListEmpty>{t('datasetPreviewEmpty')}</ItemListEmpty>
            ) : null}
            {previewItems.length > 0 ? (
              <ItemList className="py-0">
                {previewItems.map((item, index) => {
                  const title = previewItemTitle(item)
                  const subtitle = previewItemSubtitle(item)
                  const imageSrc = previewItemImage(item)
                  return (
                    <ItemListItem key={typeof item.id === 'string' ? item.id : index}>
                      <ItemListContent>
                        <div className={itemListRowBodyClassName}>
                          <ImagePreview
                            src={imageSrc}
                            alt={title}
                            mode="view"
                            className={itemListThumbClassName}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{title}</p>
                            {subtitle ? (
                              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                            ) : null}
                          </div>
                        </div>
                      </ItemListContent>
                    </ItemListItem>
                  )
                })}
              </ItemList>
            ) : null}
          </div>
        </div>
      ) : null}
    </Form>
  )

  if (chrome === 'embed-page') {
    return (
      <div className={isPreviewStep ? 'flex h-full min-h-0 flex-col p-4' : 'p-4'}>
        {body}
      </div>
    )
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('editDatasetTitle') : t('createDatasetTitle')}
      description={isEdit ? undefined : t('createDatasetDescription')}
      {...WEBSITE_DATASET_DIALOG_SIZE}
      disableContentScroll={isPreviewStep}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={() => setStep((s) => s - 1)}
            >
              {tc('previous')}
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              type="button"
              className="h-10"
              onClick={() => {
                if (validateCurrentStep()) setStep((s) => s + 1)
              }}
            >
              {tc('next')}
            </Button>
          ) : (
            <Button type="button" className="h-10" disabled={isSaving} onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? tc('save') : t('create')}
            </Button>
          )}
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}

const PREVIEW_TITLE_KEYS = ['name', 'displayName', 'label', 'title'] as const
const PREVIEW_SKIP_SUBTITLE_KEYS = new Set([
  'id',
  'name',
  'displayName',
  'label',
  'title',
  'description',
  'galleryImages',
  'avatarUrl',
  'schedule',
])

function formatPreviewValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function previewItemTitle(item: Record<string, unknown>): string {
  for (const key of PREVIEW_TITLE_KEYS) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  if (item.id != null) return String(item.id)
  return '—'
}

function previewItemSubtitle(item: Record<string, unknown>): string {
  const parts: string[] = []
  if (typeof item.description === 'string' && item.description.trim()) {
    parts.push(item.description.trim())
  }
  for (const [key, value] of Object.entries(item)) {
    if (PREVIEW_SKIP_SUBTITLE_KEYS.has(key) || value == null || typeof value === 'object') continue
    parts.push(`${key}: ${formatPreviewValue(value)}`)
    if (parts.length >= 3) break
  }
  return parts.join(' · ')
}

function previewItemImage(item: Record<string, unknown>): string | null {
  if (typeof item.avatarUrl === 'string' && item.avatarUrl.trim()) return item.avatarUrl.trim()
  const gallery = item.galleryImages
  if (!Array.isArray(gallery) || gallery.length === 0) return null
  const first = gallery[0]
  if (typeof first === 'string' && first.trim()) return first.trim()
  if (first && typeof first === 'object' && 'url' in first) {
    const url = (first as { url?: unknown }).url
    if (typeof url === 'string' && url.trim()) return url.trim()
  }
  return null
}
