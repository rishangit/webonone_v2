import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Button,
  ColorInput,
  CustomDialog,
  FormField,
  NativeSelect,
  TextField,
  Textarea,
  useToast,
} from '@webonone/mobile-ui'
import {
  mapZodIssuesToFieldErrors,
  tagFormSchema,
  type TagFormValues,
} from '@/features/data/schemas/dataSchemas'
import { randomTagColor } from '@/features/data/utils/randomTagColor'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Tag } from '@/shared/types/data.types'

function emptyValues(): TagFormValues {
  return {
    name: '',
    description: '',
    color: randomTagColor(),
    status: 'pending',
  }
}

export function TagFormDialog({
  open,
  tag,
  canSetStatus,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  tag?: Tag | null
  canSetStatus: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: Tag) => void
}) {
  const { toast } = useToast()
  const isNew = !tag
  const [values, setValues] = useState<TagFormValues>(emptyValues())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (tag) {
      setValues({
        name: tag.name,
        description: tag.description ?? '',
        color: tag.color,
        status: tag.status,
      })
      return
    }
    setValues(emptyValues())
  }, [open, tag])

  async function handleSubmit() {
    const parsed = tagFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      const body = {
        name: parsed.data.name,
        color: parsed.data.color,
        description: parsed.data.description?.trim() || null,
        status: canSetStatus ? parsed.data.status : undefined,
      }
      const saved = tag
        ? await dataAdminApi.updateTag(tag.id, body)
        : await dataAdminApi.createTag(body)
      toast({ title: tag ? 'Tag saved' : 'Tag created' })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (err) {
      toast({
        title: tag ? 'Failed to save tag' : 'Failed to create tag',
        description: err instanceof Error ? err.message : undefined,
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
      title={isNew ? 'Create tag' : 'Edit tag'}
      description="Name, color, and description."
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onPress={() => void handleSubmit()} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create tag' : 'Save changes'}
          </Button>
        </>
      }
    >
      <View className="gap-4">
        <FormField label="Name" required error={fieldErrors.name}>
          <TextField
            value={values.name}
            onChangeText={(name) => setValues((current) => ({ ...current, name }))}
            placeholder="Tag name"
          />
        </FormField>
        <ColorInput
          label="Color"
          required
          error={fieldErrors.color}
          value={values.color}
          onChange={(color) => setValues((current) => ({ ...current, color }))}
        />
        <FormField label="Description" error={fieldErrors.description}>
          <Textarea
            value={values.description ?? ''}
            onChangeText={(description) => setValues((current) => ({ ...current, description }))}
            placeholder="Optional description"
          />
        </FormField>
        {canSetStatus ? (
          <FormField label="Status" error={fieldErrors.status}>
            <NativeSelect
              value={values.status}
              onValueChange={(status) =>
                setValues((current) => ({
                  ...current,
                  status: status as TagFormValues['status'],
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
  )
}
