import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  FormField,
  NativeSelect,
  SelectTag,
  TextField,
  Textarea,
  useToast,
} from '@webonone/mobile-ui'
import { AttributePickerDialog } from '@/features/data/components/AttributePickerDialog'
import { TagMultiSelectDialog } from '@/features/data/components/TagMultiSelectDialog'
import {
  mapZodIssuesToFieldErrors,
  productWizardStep1Schema,
  serviceTimeFormSchema,
  toCreateServicePayload,
  type ServiceWizardFormValues,
} from '@/features/data/schemas/dataSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { CatalogItem } from '@/shared/types/data.types'

const TOTAL_STEPS = 5
const STEP_TITLES = ['Basics', 'Time', 'Tags', 'Attributes', 'Summary']

function emptyValues(): ServiceWizardFormValues {
  return {
    name: '',
    description: '',
    status: 'pending',
    time_mode: 'duration',
    duration_minutes: '60',
    start_time: '',
    end_time: '',
    tags: [],
    attributes: [],
  }
}

export function ServiceFormDialog({
  open,
  service,
  canSetStatus,
  initialStep = 1,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  service?: CatalogItem | null
  canSetStatus: boolean
  initialStep?: 1 | 2 | 3 | 4 | 5
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: CatalogItem) => void
}) {
  const { toast } = useToast()
  const isNew = !service
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<ServiceWizardFormValues>(emptyValues())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [attributePickerOpen, setAttributePickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep(initialStep)
    setFieldErrors({})
    if (service) {
      setValues({
        name: service.name,
        description: service.description ?? '',
        status: service.status,
        time_mode: service.timeMode ?? 'duration',
        duration_minutes: service.durationMinutes ? String(service.durationMinutes) : '60',
        start_time: service.startTime ?? '',
        end_time: service.endTime ?? '',
        tags: service.tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
        attributes: service.attributes.map((attr) => ({
          attributeId: attr.attributeId,
          name: attr.name,
          valueType: attr.valueType,
        })),
      })
    } else {
      setValues(emptyValues())
    }
  }, [open, service, initialStep])

  function validateStep(currentStep: number): boolean {
    if (currentStep === 1) {
      const parsed = productWizardStep1Schema.safeParse(values)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    if (currentStep === 2) {
      const parsed = serviceTimeFormSchema.safeParse({
        time_mode: values.time_mode,
        duration_minutes: values.duration_minutes,
        start_time: values.start_time,
        end_time: values.end_time,
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
    setSaving(true)
    try {
      const body = toCreateServicePayload(values, { canSetStatus })
      const saved = service
        ? await dataAdminApi.updateService(service.id, body)
        : await dataAdminApi.createService(body)
      toast({ title: service ? 'Service saved' : 'Service created' })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (err) {
      toast({
        title: service ? 'Failed to save service' : 'Failed to create service',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isNew ? 'Create service' : 'Edit service'}
        description={`Step ${step}/${TOTAL_STEPS} — ${STEP_TITLES[step - 1]}`}
        sizeWidth="large"
        sizeHeight="xlarge"
        footer={
          <>
            <Button variant="outline" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step > 1 ? (
              <Button variant="outline" onPress={() => setStep((current) => current - 1)}>
                Previous
              </Button>
            ) : null}
            {step < TOTAL_STEPS ? (
              <Button
                onPress={() => {
                  if (validateStep(step)) setStep((current) => current + 1)
                }}
              >
                Next
              </Button>
            ) : (
              <Button onPress={() => void handleSubmit()} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Create service' : 'Save changes'}
              </Button>
            )}
          </>
        }
      >
        {step === 1 ? (
          <View className="gap-4">
            <FormField label="Name" required error={fieldErrors.name}>
              <TextField
                value={values.name}
                onChangeText={(name) => setValues((current) => ({ ...current, name }))}
              />
            </FormField>
            <FormField label="Description" error={fieldErrors.description}>
              <Textarea
                value={values.description}
                onChangeText={(description) => setValues((current) => ({ ...current, description }))}
              />
            </FormField>
            {canSetStatus ? (
              <FormField label="Status" error={fieldErrors.status}>
                <NativeSelect
                  value={values.status}
                  onValueChange={(status) =>
                    setValues((current) => ({
                      ...current,
                      status: status as ServiceWizardFormValues['status'],
                    }))
                  }
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Verified', value: 'verified' },
                  ]}
                />
              </FormField>
            ) : null}
          </View>
        ) : null}
        {step === 2 ? (
          <View className="gap-4">
            <FormField label="Time mode" error={fieldErrors.time_mode}>
              <NativeSelect
                value={values.time_mode}
                onValueChange={(time_mode) =>
                  setValues((current) => ({
                    ...current,
                    time_mode: time_mode as ServiceWizardFormValues['time_mode'],
                  }))
                }
                options={[
                  { label: 'Duration', value: 'duration' },
                  { label: 'Time window', value: 'window' },
                ]}
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
                <FormField label="Start time (HH:mm)" error={fieldErrors.start_time}>
                  <TextField
                    value={values.start_time}
                    onChangeText={(start_time) =>
                      setValues((current) => ({ ...current, start_time }))
                    }
                    placeholder="09:00"
                  />
                </FormField>
                <FormField label="End time (HH:mm)" error={fieldErrors.end_time}>
                  <TextField
                    value={values.end_time}
                    onChangeText={(end_time) => setValues((current) => ({ ...current, end_time }))}
                    placeholder="17:00"
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
            {values.attributes.length === 0 ? (
              <Body className="text-muted">No attributes selected.</Body>
            ) : (
              values.attributes.map((row) => (
                <View key={row.attributeId} className="flex-row items-center justify-between gap-2">
                  <Body>{row.name}</Body>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      setValues((current) => ({
                        ...current,
                        attributes: current.attributes.filter(
                          (item) => item.attributeId !== row.attributeId,
                        ),
                      }))
                    }
                  >
                    Remove
                  </Button>
                </View>
              ))
            )}
          </View>
        ) : null}
        {step === 5 ? (
          <View className="gap-2">
            <Body className="font-medium">{values.name}</Body>
            <Body className="text-muted">{values.description || 'No description'}</Body>
            <Body>
              {values.time_mode === 'duration'
                ? `${values.duration_minutes} min`
                : `${values.start_time} – ${values.end_time}`}
            </Body>
            <Body>{values.tags.length} tag(s)</Body>
            <Body>{values.attributes.length} attribute(s)</Body>
          </View>
        ) : null}
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
        selected={values.attributes}
        onDone={(attributes) => setValues((current) => ({ ...current, attributes }))}
      />
    </>
  )
}
