import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  Checkbox,
  CustomDialog,
  FormField,
  NativeSelect,
  TextField,
  Textarea,
  useToast,
} from '@webonone/mobile-ui'
import {
  mapZodIssuesToFieldErrors,
  unitFormSchema,
  type UnitFormValues,
} from '@/features/data/schemas/dataSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Unit } from '@/shared/types/data.types'

function emptyValues(): UnitFormValues {
  return {
    name: '',
    description: '',
    symbol: '',
    isBase: false,
    baseUnitId: '',
    status: 'pending',
  }
}

export function UnitFormDialog({
  open,
  unit,
  canSetStatus,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  unit?: Unit | null
  canSetStatus: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: Unit) => void
}) {
  const { toast } = useToast()
  const isNew = !unit
  const [values, setValues] = useState<UnitFormValues>(emptyValues())
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [baseUnits, setBaseUnits] = useState<Unit[]>([])

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (unit) {
      setValues({
        name: unit.name,
        description: unit.description ?? '',
        symbol: unit.symbol,
        isBase: unit.isBase,
        baseUnitId: unit.baseUnitId ?? '',
        status: unit.status,
      })
    } else {
      setValues(emptyValues())
    }
  }, [open, unit])

  useEffect(() => {
    if (!open) return
    void dataAdminApi
      .listUnits({ is_base: 'true', pageSize: 200 })
      .then((result) => setBaseUnits(result.items))
      .catch(() => setBaseUnits([]))
  }, [open])

  async function handleSubmit() {
    const parsed = unitFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      const body = {
        name: parsed.data.name,
        symbol: parsed.data.symbol,
        description: parsed.data.description?.trim() || null,
        is_base: parsed.data.isBase,
        base_unit_id: parsed.data.isBase ? null : parsed.data.baseUnitId || null,
        status: canSetStatus ? parsed.data.status : undefined,
      }
      const saved = unit
        ? await dataAdminApi.updateUnit(unit.id, body)
        : await dataAdminApi.createUnit(body)
      toast({ title: unit ? 'Unit saved' : 'Unit created' })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (err) {
      toast({
        title: unit ? 'Failed to save unit' : 'Failed to create unit',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const baseUnitOptions = baseUnits
    .filter((item) => item.id !== unit?.id)
    .map((item) => ({ label: `${item.name} (${item.symbol})`, value: item.id }))

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? 'Create unit' : 'Edit unit'}
      description="Name, symbol, and base unit."
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onPress={() => void handleSubmit()} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create unit' : 'Save changes'}
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
        <FormField label="Symbol" required error={fieldErrors.symbol}>
          <TextField
            value={values.symbol}
            onChangeText={(symbol) => setValues((current) => ({ ...current, symbol }))}
          />
        </FormField>
        <FormField label="Description" error={fieldErrors.description}>
          <Textarea
            value={values.description ?? ''}
            onChangeText={(description) => setValues((current) => ({ ...current, description }))}
          />
        </FormField>
        <View className="flex-row items-center gap-2">
          <Checkbox
            checked={values.isBase}
            onCheckedChange={(isBase) =>
              setValues((current) => ({
                ...current,
                isBase: Boolean(isBase),
                baseUnitId: isBase ? '' : current.baseUnitId,
              }))
            }
          />
          <Body>Base unit</Body>
        </View>
        {!values.isBase ? (
          <FormField label="Base unit" error={fieldErrors.baseUnitId}>
            <NativeSelect
              value={values.baseUnitId ?? ''}
              onValueChange={(baseUnitId) => setValues((current) => ({ ...current, baseUnitId }))}
              options={[{ label: 'Select base unit', value: '' }, ...baseUnitOptions]}
            />
          </FormField>
        ) : null}
        {canSetStatus ? (
          <FormField label="Status" error={fieldErrors.status}>
            <NativeSelect
              value={values.status}
              onValueChange={(status) =>
                setValues((current) => ({
                  ...current,
                  status: status as UnitFormValues['status'],
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
