import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Check } from 'lucide-react-native'
import {
  Body,
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
  SearchInput,
  Switch,
  UserSelectionDialog,
  type UserOption,
} from '@webonone/mobile-ui'
import { mapZodIssuesToFieldErrors } from '@/features/data/schemas/dataSchemas'
import {
  EMPTY_WORKFLOW_WIZARD_VALUES,
  WORKFLOW_STEP_TITLES_DURATION,
  WORKFLOW_STEP_TITLES_WINDOW,
  workflowWizardStepSpaceOptionalSchema,
  workflowWizardStepSpaceSchema,
  workflowWizardTotalSteps,
  type WorkflowWizardStep,
  type WorkflowWizardValues,
} from '@/features/data/company-catalog/schemas/workflowSchemas'
import { designFormsApi, type DesignFormTemplateListItem } from '@/features/design/services/designFormsApi'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import { hydrateLinkedCatalogItems } from '@/features/data/company-catalog/utils/hydrateLinkedCatalog'
import { staffApi } from '@/features/staff/services/staffApi'
import type { ServiceWorkflowItem } from '@/features/sales/types/catalog.types'

function valuesFromItem(item: ServiceWorkflowItem | null): WorkflowWizardValues {
  if (!item) return { ...EMPTY_WORKFLOW_WIZARD_VALUES }
  return {
    space: item.space,
    staff: item.staff,
    forms: item.forms.map((form) => ({
      id: form.id,
      name: form.name ?? form.id,
    })),
    sessionQueue: Boolean(item.sessionQueue),
    addItemsEnabled: Boolean(item.addItemsEnabled),
    addItemsFromLibraryEnabled: Boolean(item.addItemsFromLibraryEnabled),
  }
}

export function WorkflowItemFormDialog({
  open,
  timeMode,
  usedSpaceIds,
  initial,
  orderNumber,
  saving = false,
  onClose,
  onSave,
}: {
  open: boolean
  timeMode?: 'duration' | 'window'
  usedSpaceIds: string[]
  initial: ServiceWorkflowItem | null
  orderNumber: number
  saving?: boolean
  onClose: () => void
  onSave: (item: ServiceWorkflowItem) => void
}) {
  const showQueue = timeMode === 'window'
  const totalSteps = workflowWizardTotalSteps(timeMode)
  const stepTitles = showQueue ? WORKFLOW_STEP_TITLES_WINDOW : WORKFLOW_STEP_TITLES_DURATION
  const stepKeys = showQueue
    ? (['space', 'staff', 'forms', 'queue', 'summary'] as const)
    : (['space', 'staff', 'forms', 'summary'] as const)

  const [step, setStep] = useState<WorkflowWizardStep>(1)
  const [values, setValues] = useState<WorkflowWizardValues>(EMPTY_WORKFLOW_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [staffPickerOpen, setStaffPickerOpen] = useState(false)
  const [staffUsers, setStaffUsers] = useState<UserOption[]>([])
  const [spaceSearch, setSpaceSearch] = useState('')
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([])
  const [forms, setForms] = useState<DesignFormTemplateListItem[]>([])
  const spaceOptional = initial?.kind === 'check_in'
  const excluded = useMemo(() => new Set(usedSpaceIds), [usedSpaceIds])

  useEffect(() => {
    if (!open) return
    setStep(1)
    setValues(valuesFromItem(initial))
    setFieldErrors({})
    setSpaceSearch('')
    void staffApi.list({ pageSize: 500 }).then((result) => {
      setStaffUsers(
        result.items.map((member) => ({
          id: member.id,
          displayName: member.displayName,
          email: member.email ?? '',
          avatarUrl: member.avatarUrl ?? null,
        })),
      )
    })
    void companyCatalogApi.list('spaces').then(async (result) => {
      const hydrated = await hydrateLinkedCatalogItems('spaces', result.items)
      setSpaces(
        hydrated
          .filter((space) => !excluded.has(space.id) || space.id === values.space?.id)
          .map((space) => ({ id: space.id, name: space.displayName })),
      )
    })
    void designFormsApi.listPublished().then((result) => setForms(result.items))
  }, [open, initial, excluded, values.space?.id])

  const filteredSpaces = useMemo(() => {
    const q = spaceSearch.trim().toLowerCase()
    if (!q) return spaces
    return spaces.filter((space) => space.name.toLowerCase().includes(q))
  }, [spaceSearch, spaces])

  function validateSpaceStep(): boolean {
    const schema = spaceOptional
      ? workflowWizardStepSpaceOptionalSchema
      : workflowWizardStepSpaceSchema
    const result = schema.safeParse({ space: values.space })
    if (result.success) {
      setFieldErrors({})
      return true
    }
    setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues) as Record<string, string>)
    return false
  }

  function handleNext() {
    if (stepKeys[step - 1] === 'space' && !validateSpaceStep()) return
    setStep((current) => Math.min(totalSteps, current + 1) as WorkflowWizardStep)
  }

  function handleSave() {
    const draft: ServiceWorkflowItem = {
      id: initial?.id ?? `draft-${Date.now()}`,
      kind: initial?.kind ?? 'space',
      orderNumber,
      space: values.space,
      staff: values.staff,
      forms: values.forms,
      sessionQueue: values.sessionQueue,
      addItemsEnabled: values.addItemsEnabled,
      addItemsFromLibraryEnabled: values.addItemsFromLibraryEnabled,
    }
    onSave(draft)
  }

  const currentKey = stepKeys[step - 1]

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={(next) => !next && onClose()}
        title="Workflow item"
        description={`Step ${step} of ${totalSteps} — ${stepTitles[step - 1]}`}
        sizeWidth="large"
        sizeHeight="xlarge"
        footer={
          <>
            <Button variant="outline" onPress={onClose} disabled={saving}>
              Cancel
            </Button>
            {step > 1 ? (
              <Button
                variant="outline"
                onPress={() => setStep((current) => (current - 1) as WorkflowWizardStep)}
                disabled={saving}
              >
                Previous
              </Button>
            ) : null}
            {step < totalSteps ? (
              <Button onPress={handleNext} disabled={saving}>
                Next
              </Button>
            ) : (
              <Button onPress={handleSave} disabled={saving}>
                Save
              </Button>
            )}
          </>
        }
      >
        {currentKey === 'space' ? (
          <View className="gap-3">
            {fieldErrors.space ? <Body className="text-destructive">{fieldErrors.space}</Body> : null}
            <SearchInput
              value={spaceSearch}
              onChangeText={setSpaceSearch}
              onClear={spaceSearch ? () => setSpaceSearch('') : undefined}
              placeholder="Search spaces"
              accessibilityLabel="Search spaces"
            />
            <ItemList className="max-h-64 py-0">
              {filteredSpaces.length === 0 ? (
                <ItemListEmpty>No spaces found.</ItemListEmpty>
              ) : (
                filteredSpaces.map((space) => {
                  const selected = values.space?.id === space.id
                  return (
                    <ItemListItem
                      key={space.id}
                      selected={selected}
                      onPress={() =>
                        setValues((prev) => ({
                          ...prev,
                          space: selected ? null : { id: space.id, name: space.name },
                        }))
                      }
                    >
                      <ItemListContent title={space.name} />
                      {selected ? <Check className="h-5 w-5 text-primary" /> : null}
                    </ItemListItem>
                  )
                })
              )}
            </ItemList>
          </View>
        ) : null}

        {currentKey === 'staff' ? (
          <View className="gap-3">
            <Button size="sm" variant="outline" onPress={() => setStaffPickerOpen(true)}>
              Add staff
            </Button>
            {values.staff.length === 0 ? (
              <Muted>No staff selected.</Muted>
            ) : (
              values.staff.map((member) => (
                <View key={member.id} className="flex-row items-center justify-between gap-2">
                  <Body>{member.displayName}</Body>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      setValues((prev) => ({
                        ...prev,
                        staff: prev.staff.filter((entry) => entry.id !== member.id),
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

        {currentKey === 'forms' ? (
          <ItemList className="max-h-72 py-0">
            {forms.length === 0 ? (
              <ItemListEmpty>No published forms.</ItemListEmpty>
            ) : (
              forms.map((form) => {
                const selected = values.forms.some((entry) => entry.id === form.id)
                return (
                  <ItemListItem
                    key={form.id}
                    selected={selected}
                    onPress={() =>
                      setValues((prev) => ({
                        ...prev,
                        forms: selected
                          ? prev.forms.filter((entry) => entry.id !== form.id)
                          : [...prev.forms, { id: form.id, name: form.name }],
                      }))
                    }
                  >
                    <ItemListContent title={form.name} />
                    {selected ? <Check className="h-5 w-5 text-primary" /> : null}
                  </ItemListItem>
                )
              })
            )}
          </ItemList>
        ) : null}

        {currentKey === 'queue' ? (
          <View className="gap-4">
            <Switch
              label="Session queue"
              checked={values.sessionQueue}
              onCheckedChange={(sessionQueue) =>
                setValues((prev) => ({ ...prev, sessionQueue }))
              }
            />
            <Switch
              label="Add items"
              checked={values.addItemsEnabled}
              onCheckedChange={(addItemsEnabled) =>
                setValues((prev) => ({ ...prev, addItemsEnabled }))
              }
            />
            <Switch
              label="Add items from library"
              checked={values.addItemsFromLibraryEnabled}
              onCheckedChange={(addItemsFromLibraryEnabled) =>
                setValues((prev) => ({ ...prev, addItemsFromLibraryEnabled }))
              }
            />
          </View>
        ) : null}

        {currentKey === 'summary' ? (
          <View className="gap-2">
            <Body>Space: {values.space?.name ?? '—'}</Body>
            <Body>Staff: {values.staff.map((s) => s.displayName).join(', ') || '—'}</Body>
            <Body>Forms: {values.forms.map((f) => f.name).join(', ') || '—'}</Body>
            {showQueue ? (
              <>
                <Body>Session queue: {values.sessionQueue ? 'Yes' : 'No'}</Body>
                <Body>Add items: {values.addItemsEnabled ? 'Yes' : 'No'}</Body>
              </>
            ) : null}
          </View>
        ) : null}
      </CustomDialog>

      <UserSelectionDialog
        open={staffPickerOpen}
        onOpenChange={setStaffPickerOpen}
        users={staffUsers}
        title="Select staff"
        onSelect={(user) => {
          setValues((prev) => {
            if (prev.staff.some((entry) => entry.id === user.id)) return prev
            return {
              ...prev,
              staff: [...prev.staff, { id: user.id, displayName: user.displayName }],
            }
          })
          setStaffPickerOpen(false)
        }}
      />
    </>
  )
}
