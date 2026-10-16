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
  type SelectTagValue,
} from '@webonone/mobile-ui'
import { AttributePickerDialog } from '@/features/data/components/AttributePickerDialog'
import { TagMultiSelectDialog } from '@/features/data/components/TagMultiSelectDialog'
import {
  mapZodIssuesToFieldErrors,
  spaceFormSchema,
  toCreateSpacePayload,
  type ProductAttributeRow,
  type SpaceFormValues,
} from '@/features/data/schemas/dataSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import {
  dataLibraryApi,
  type LibraryListItem,
} from '@/features/sales/services/dataLibraryApi'
import type { CatalogItem } from '@/shared/types/data.types'

const TOTAL_STEPS = 4
const STEP_TITLES = ['Basics', 'Tags', 'Attributes', 'Summary']

type SpaceWizardValues = SpaceFormValues & {
  tags: SelectTagValue[]
  attributes: ProductAttributeRow[]
}

function emptyValues(): SpaceWizardValues {
  return {
    name: '',
    description: '',
    status: 'pending',
    tags: [],
    attributes: [],
  }
}

export function SpaceFormDialog({
  open,
  space,
  canSetStatus,
  initialStep = 1,
  onOpenChange,
  onSaved,
  onLibraryCreate,
}: {
  open: boolean
  space?: CatalogItem | null
  canSetStatus: boolean
  initialStep?: 1 | 2 | 3 | 4
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: CatalogItem) => void
  onLibraryCreate?: (item: LibraryListItem) => void
}) {
  const { toast } = useToast()
  const isNew = !space
  const libraryCreateOnly = Boolean(onLibraryCreate) && isNew
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<SpaceWizardValues>(emptyValues())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [attributePickerOpen, setAttributePickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep(initialStep)
    setFieldErrors({})
    if (space) {
      setValues({
        name: space.name,
        description: space.description ?? '',
        status: space.status,
        tags: space.tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
        attributes: space.attributes.map((attr) => ({
          attributeId: attr.attributeId,
          name: attr.name,
          valueType: attr.valueType,
        })),
      })
    } else {
      setValues(emptyValues())
    }
  }, [open, space, initialStep])

  function validateStep(currentStep: number): boolean {
    if (currentStep === 1) {
      const parsed = spaceFormSchema.safeParse(values)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    setFieldErrors({})
    return true
  }

  async function handleSubmit() {
    if (!validateStep(1)) {
      setStep(1)
      return
    }
    setSaving(true)
    try {
      const body = toCreateSpacePayload(values, { canSetStatus })
      if (libraryCreateOnly && onLibraryCreate) {
        const saved = await dataLibraryApi.createSpace(body)
        toast({ title: 'Space created' })
        onOpenChange(false)
        onLibraryCreate(saved)
        return
      }
      const saved = space
        ? await dataAdminApi.updateSpace(space.id, body)
        : await dataAdminApi.createSpace(body)
      toast({ title: space ? 'Space saved' : 'Space created' })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (err) {
      toast({
        title: space ? 'Failed to save space' : 'Failed to create space',
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
        title={isNew ? 'Create space' : 'Edit space'}
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
                {saving ? 'Saving…' : isNew ? 'Create space' : 'Save changes'}
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
                value={values.description ?? ''}
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
                      status: status as SpaceFormValues['status'],
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
          <FormField label="Tags">
            <SelectTag
              multiple
              selectedTags={values.tags}
              placeholder="Select tags"
              onPress={() => setTagPickerOpen(true)}
            />
          </FormField>
        ) : null}
        {step === 3 ? (
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
        {step === 4 ? (
          <View className="gap-2">
            <Body className="font-medium">{values.name}</Body>
            <Body className="text-muted">{values.description || 'No description'}</Body>
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
