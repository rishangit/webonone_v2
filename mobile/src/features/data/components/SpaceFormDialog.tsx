import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
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
import { TagMultiSelectDialog } from '@/features/data/components/TagMultiSelectDialog'
import {
  mapZodIssuesToFieldErrors,
  spaceFormSchema,
  toCreateSpacePayload,
  type SpaceFormValues,
} from '@/features/data/schemas/dataSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { CatalogItem } from '@/shared/types/data.types'

function emptyValues(): SpaceFormValues & { tags: SelectTagValue[] } {
  return {
    name: '',
    description: '',
    status: 'pending',
    tags: [],
  }
}

export function SpaceFormDialog({
  open,
  space,
  canSetStatus,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  space?: CatalogItem | null
  canSetStatus: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: CatalogItem) => void
}) {
  const { toast } = useToast()
  const isNew = !space
  const [values, setValues] = useState(emptyValues())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (space) {
      setValues({
        name: space.name,
        description: space.description ?? '',
        status: space.status,
        tags: space.tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
      })
    } else {
      setValues(emptyValues())
    }
  }, [open, space])

  async function handleSubmit() {
    const parsed = spaceFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      const body = toCreateSpacePayload({ ...parsed.data, tags: values.tags }, { canSetStatus })
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
        description="Name, tags, and description."
        sizeWidth="medium"
        sizeHeight="large"
        footer={
          <>
            <Button variant="outline" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onPress={() => void handleSubmit()} disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Create space' : 'Save changes'}
            </Button>
          </>
        }
      >
        <View className="gap-4">
          <FormField label="Name" required error={fieldErrors.name}>
            <TextField
              value={values.name}
              onChangeText={(name) => setValues((current) => ({ ...current, name }))}
            />
          </FormField>
          <FormField label="Tags">
            <SelectTag
              multiple
              selectedTags={values.tags}
              placeholder="Select tags"
              onPress={() => setTagPickerOpen(true)}
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
      </CustomDialog>
      <TagMultiSelectDialog
        open={tagPickerOpen}
        onOpenChange={setTagPickerOpen}
        selectedTags={values.tags}
        onDone={(tags) => setValues((current) => ({ ...current, tags }))}
      />
    </>
  )
}
