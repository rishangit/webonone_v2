import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  CustomDialog,
  FormField,
  SelectTag,
  Spinner,
  TextField,
  Textarea,
  useToast,
} from '@webonone/mobile-ui'
import {
  CatalogWizardStepSource,
  type CatalogAddSource,
} from '@/features/data/company-catalog/components/CatalogWizardStepSource'
import {
  buildLibraryPick,
  LibraryPickerPanel,
} from '@/features/data/company-catalog/components/LibraryPickerPanel'
import {
  EMPTY_SERVICE_WIZARD_VALUES,
  serviceTimeFormSchema,
  serviceWizardStep1Schema,
  toCompanyServicePayload,
  valuesFromServicePayload,
  type ServiceWizardFormValues,
  type ServiceWizardStep,
} from '@/features/data/company-catalog/schemas/serviceSchemas'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import { dataLibraryApi } from '@/features/sales/services/dataLibraryApi'
import { mapZodIssuesToFieldErrors } from '@/features/data/schemas/dataSchemas'
import { TagMultiSelectDialog } from '@/features/data/components/TagMultiSelectDialog'
import { AttributePickerDialog } from '@/features/data/components/AttributePickerDialog'

const TOTAL_STEPS = 5
const STEP_TITLES = ['Basics', 'Time', 'Tags', 'Attributes', 'Summary'] as const
type AddPhase = 'source' | 'library' | 'create'

export function CompanyServiceFormDialog({
  open,
  id,
  initialStep = 1,
  includeSourceStep = false,
  excludeLibraryIds = [],
  onOpenChange,
  onSaved,
}: {
  open: boolean
  id?: string
  initialStep?: ServiceWizardStep
  includeSourceStep?: boolean
  excludeLibraryIds?: string[]
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const isNew = !id
  const showSource = isNew && includeSourceStep

  const [phase, setPhase] = useState<AddPhase>(showSource ? 'source' : 'create')
  const [source, setSource] = useState<CatalogAddSource | null>(null)
  const [step, setStep] = useState<ServiceWizardStep>(initialStep)
  const [values, setValues] = useState<ServiceWizardFormValues>(EMPTY_SERVICE_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [attributePickerOpen, setAttributePickerOpen] = useState(false)
  const [librarySelectedId, setLibrarySelectedId] = useState<string | null>(null)
  const [librarySelected, setLibrarySelected] = useState<{ id: string } | null>(null)
  const [libraryCreateOpen, setLibraryCreateOpen] = useState(false)
  const [attributeOptions, setAttributeOptions] = useState<Array<{ id: string; valueType: string }>>(
    [],
  )

  const title = useMemo(() => {
    if (phase === 'library') return 'Add services from library'
    if (phase === 'source') return 'Add service'
    return isNew ? 'Create service' : 'Edit service'
  }, [isNew, phase])

  useEffect(() => {
    if (!open) return
    void dataLibraryApi.list('attributes', { pageSize: 100 }).then((result) => {
      setAttributeOptions(
        result.items.map((item) => ({
          id: item.id,
          valueType: typeof item.valueType === 'string' ? item.valueType : 'text',
        })),
      )
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    setPhase(showSource ? 'source' : 'create')
    setSource(null)
    setStep(initialStep)
    setFieldErrors({})
    setLibrarySelected(null)
    setLibrarySelectedId(null)

    if (!id) {
      setValues(EMPTY_SERVICE_WIZARD_VALUES)
      return
    }

    setSeedLoading(true)
    void companyCatalogApi
      .get('services', id)
      .then(async (item) => {
        const tagIds = Array.isArray(item.payload?.tagIds)
          ? (item.payload!.tagIds as unknown[]).filter((v): v is string => typeof v === 'string')
          : []
        let tags: ServiceWizardFormValues['tags'] = []
        if (tagIds.length > 0) {
          const tagsResult = await dataLibraryApi.list('tags', { ids: tagIds, pageSize: tagIds.length })
          tags = tagsResult.items.map((tag) => ({
            id: tag.id,
            name: tag.name,
            color: typeof tag.color === 'string' ? tag.color : '#2563EB',
          }))
        }
        const payload = item.payload ?? {}
        setValues(valuesFromServicePayload(payload, tags))
      })
      .catch(() => setValues(EMPTY_SERVICE_WIZARD_VALUES))
      .finally(() => setSeedLoading(false))
  }, [open, id, initialStep, showSource])

  function validateStep(currentStep: number): boolean {
    if (currentStep === 1) {
      const parsed = serviceWizardStep1Schema.safeParse(values)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    if (currentStep === 2) {
      const parsed = serviceTimeFormSchema.safeParse({
        time_mode: values.time_mode,
        duration_minutes: values.duration_minutes ? Number(values.duration_minutes) : null,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
      })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    setFieldErrors({})
    return true
  }

  async function handleSubmit() {
    if (!validateStep(step)) return
    const payload = toCompanyServicePayload(values, {
      canSetStatus: false,
      attributes: attributeOptions,
    })
    setSaving(true)
    try {
      if (isNew) {
        await companyCatalogApi.createCustom('services', payload)
        toast({ title: tc('create') })
      } else if (id) {
        await companyCatalogApi.update('services', id, payload)
        toast({ title: tc('save') })
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast({
        title: isNew ? tc('create') : tc('save'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleLibraryPick() {
    if (!librarySelected) return
    setSaving(true)
    try {
      const pick = buildLibraryPick(
        'services',
        librarySelected as import('@/features/sales/services/dataLibraryApi').LibraryListItem,
        'linked',
      )
      await companyCatalogApi.fromLibrary('services', pick)
      toast({ title: tc('create') })
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast({
        title: tc('create'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const wizardBody = seedLoading ? (
    <Spinner label="Loading service…" />
  ) : (
    <>
      {step === 1 ? (
        <View className="gap-4">
          <FormField label={tc('name')} required error={fieldErrors.name}>
            <TextField
              value={values.name}
              onChangeText={(name) => setValues((current) => ({ ...current, name }))}
            />
          </FormField>
          <FormField label={tc('description')} error={fieldErrors.description}>
            <Textarea
              value={values.description}
              onChangeText={(description) => setValues((current) => ({ ...current, description }))}
            />
          </FormField>
          <FormField label="List price (LKR)">
            <TextField
              value={values.listPrice}
              onChangeText={(listPrice) => setValues((current) => ({ ...current, listPrice }))}
              keyboardType="decimal-pad"
            />
          </FormField>
        </View>
      ) : null}
      {step === 2 ? (
        <View className="gap-4">
          <FormField label="Time mode">
            <TextField
              value={values.time_mode}
              onChangeText={(time_mode) =>
                setValues((current) => ({
                  ...current,
                  time_mode: time_mode === 'window' ? 'window' : 'duration',
                }))
              }
              placeholder="duration or window"
            />
          </FormField>
          {values.time_mode === 'duration' ? (
            <FormField label="Duration (minutes)" error={fieldErrors.duration_minutes}>
              <TextField
                value={values.duration_minutes}
                onChangeText={(duration_minutes) =>
                  setValues((current) => ({ ...current, duration_minutes }))
                }
                keyboardType="number-pad"
              />
            </FormField>
          ) : (
            <>
              <FormField label="Start (HH:mm)" error={fieldErrors.start_time}>
                <TextField
                  value={values.start_time}
                  onChangeText={(start_time) => setValues((current) => ({ ...current, start_time }))}
                />
              </FormField>
              <FormField label="End (HH:mm)" error={fieldErrors.end_time}>
                <TextField
                  value={values.end_time}
                  onChangeText={(end_time) => setValues((current) => ({ ...current, end_time }))}
                />
              </FormField>
            </>
          )}
        </View>
      ) : null}
      {step === 3 ? (
        <FormField label="Tags">
          <SelectTag
            multiple
            selectedTags={values.tags}
            placeholder="Select tags"
            onPress={() => setTagPickerOpen(true)}
          />
        </FormField>
      ) : null}
      {step === 4 ? (
        <View className="gap-3">
          <Button size="sm" variant="outline" onPress={() => setAttributePickerOpen(true)}>
            Add attribute
          </Button>
          {values.attributes.map((row) => (
            <View key={row.attributeId} className="gap-2">
              <Body className="font-medium">{row.name}</Body>
              {row.valueType === 'number' ? (
                <TextField
                  value={row.valueNumber}
                  onChangeText={(valueNumber) =>
                    setValues((current) => ({
                      ...current,
                      attributes: current.attributes.map((attr) =>
                        attr.attributeId === row.attributeId
                          ? { ...attr, valueNumber }
                          : attr,
                      ),
                    }))
                  }
                  keyboardType="decimal-pad"
                />
              ) : (
                <TextField
                  value={row.valueText}
                  onChangeText={(valueText) =>
                    setValues((current) => ({
                      ...current,
                      attributes: current.attributes.map((attr) =>
                        attr.attributeId === row.attributeId ? { ...attr, valueText } : attr,
                      ),
                    }))
                  }
                />
              )}
            </View>
          ))}
        </View>
      ) : null}
      {step === 5 ? (
        <View className="gap-2">
          <Body className="font-medium">{values.name}</Body>
          <Body className="text-muted">{values.description || '—'}</Body>
        </View>
      ) : null}
    </>
  )

  const body =
    phase === 'source' ? (
      <CatalogWizardStepSource value={source} onChange={setSource} entityLabel="service" />
    ) : phase === 'library' ? (
      <LibraryPickerPanel
        active={open && phase === 'library'}
        kind="services"
        excludeLibraryIds={excludeLibraryIds}
        selectedId={librarySelectedId}
        onSelectedChange={(item) => {
          setLibrarySelected(item)
          setLibrarySelectedId(item?.id ?? null)
        }}
        onCreateOpenChange={setLibraryCreateOpen}
      />
    ) : (
      wizardBody
    )

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={
          phase === 'create'
            ? `Step ${step}/${TOTAL_STEPS} — ${STEP_TITLES[step - 1]}`
            : undefined
        }
        sizeWidth="large"
        sizeHeight="xlarge"
        nestedDismissGuard={libraryCreateOpen}
        footer={
          phase === 'library' ? (
            <>
              <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving || libraryCreateOpen}>
                {tc('cancel')}
              </Button>
              <Button variant="outline" onPress={() => setPhase('source')} disabled={saving || libraryCreateOpen}>
                Previous
              </Button>
              <Button onPress={() => void handleLibraryPick()} disabled={!librarySelected || saving || libraryCreateOpen}>
                Add
              </Button>
            </>
          ) : phase === 'source' ? (
            <>
              <Button variant="outline" onPress={() => onOpenChange(false)}>
                {tc('cancel')}
              </Button>
              <Button
                onPress={() => {
                  if (!source) return
                  setPhase(source === 'library' ? 'library' : 'create')
                }}
                disabled={!source}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
                {tc('cancel')}
              </Button>
              {showSource && step === 1 ? (
                <Button variant="outline" onPress={() => setPhase('source')} disabled={saving}>
                  Previous
                </Button>
              ) : null}
              {step > 1 ? (
                <Button
                  variant="outline"
                  onPress={() => setStep((current) => (current - 1) as ServiceWizardStep)}
                  disabled={saving}
                >
                  Previous
                </Button>
              ) : null}
              {step < TOTAL_STEPS ? (
                <Button
                  onPress={() => {
                    if (validateStep(step)) setStep((current) => (current + 1) as ServiceWizardStep)
                  }}
                  disabled={saving || seedLoading}
                >
                  Next
                </Button>
              ) : (
                <Button onPress={() => void handleSubmit()} disabled={saving || seedLoading}>
                  {saving ? tc('loading') : isNew ? 'Create service' : 'Save changes'}
                </Button>
              )}
            </>
          )
        }
      >
        {body}
      </CustomDialog>
      <TagMultiSelectDialog
        open={tagPickerOpen}
        onOpenChange={setTagPickerOpen}
        selectedTags={values.tags}
        onDone={(tags) => setValues((current) => ({ ...current, tags }))}
      />
      <AttributePickerDialog
        open={attributePickerOpen}
        onOpenChange={setAttributePickerOpen}
        selected={values.attributes.map((row) => ({
          attributeId: row.attributeId,
          name: row.name,
          valueType: row.valueType === 'number' ? 'number' : 'text',
        }))}
        onDone={(attributes) =>
          setValues((current) => ({
            ...current,
            attributes: attributes.map((row) => ({
              attributeId: row.attributeId,
              name: row.name,
              valueType: row.valueType === 'number' ? 'number' : 'text',
              valueText: '',
              valueNumber: '',
            })),
          }))
        }
      />
    </>
  )
}
