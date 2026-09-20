import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Button,
  CustomDialog,
  FormField,
  NativeSelect,
  TextField,
  Textarea,
  useToast,
} from '@webonone/mobile-ui'
import {
  attributeFormSchema,
  mapZodIssuesToFieldErrors,
  type AttributeFormValues,
} from '@/features/data/schemas/dataSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Attribute, Unit } from '@/shared/types/data.types'

function emptyValues(): AttributeFormValues {
  return {
    name: '',
    description: '',
    valueType: 'text',
    unitId: '',
    status: 'pending',
  }
}

export function AttributeFormDialog({
  open,
  attribute,
  canSetStatus,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  attribute?: Attribute | null
  canSetStatus: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: Attribute) => void
}) {
  const { toast } = useToast()
  const isNew = !attribute
  const [values, setValues] = useState<AttributeFormValues>(emptyValues())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (attribute) {
      setValues({
        name: attribute.name,
        description: attribute.description ?? '',
        valueType: attribute.valueType,
        unitId: attribute.unitId ?? '',
        status: attribute.status,
      })
    } else {
      setValues(emptyValues())
    }
  }, [open, attribute])

  useEffect(() => {
    if (!open) return
    void dataAdminApi
      .listUnits({ pageSize: 200 })
      .then((result) => setUnits(result.items))
      .catch(() => setUnits([]))
  }, [open])

  async function handleSubmit() {
    const parsed = attributeFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      const body = {
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
        value_type: parsed.data.valueType,
        unit_id: parsed.data.unitId || null,
        status: canSetStatus ? parsed.data.status : undefined,
      }
      const saved = attribute
        ? await dataAdminApi.updateAttribute(attribute.id, body)
        : await dataAdminApi.createAttribute(body)
      toast({ title: attribute ? 'Attribute saved' : 'Attribute created' })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (err) {
      toast({
        title: attribute ? 'Failed to save attribute' : 'Failed to create attribute',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const unitOptions = units.map((item) => ({
    label: `${item.name} (${item.symbol})`,
    value: item.id,
  }))

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? 'Create attribute' : 'Edit attribute'}
      description="Name, value type, and optional unit."
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onPress={() => void handleSubmit()} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create attribute' : 'Save changes'}
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
        <FormField label="Value type" required error={fieldErrors.valueType}>
          <NativeSelect
            value={values.valueType}
            onValueChange={(valueType) =>
              setValues((current) => ({
                ...current,
                valueType: valueType as AttributeFormValues['valueType'],
              }))
            }
            options={[
              { label: 'Text', value: 'text' },
              { label: 'Number', value: 'number' },
            ]}
          />
        </FormField>
        <FormField label="Unit of measure" error={fieldErrors.unitId}>
          <NativeSelect
            value={values.unitId ?? ''}
            onValueChange={(unitId) => setValues((current) => ({ ...current, unitId }))}
            options={[{ label: 'None', value: '' }, ...unitOptions]}
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
                  status: status as AttributeFormValues['status'],
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
