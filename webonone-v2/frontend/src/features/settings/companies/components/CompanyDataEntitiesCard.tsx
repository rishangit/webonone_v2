import { useEffect, useRef, useState } from 'react'
import {
  COMPANY_DATA_ENTITY_KEYS,
  DATA_ENTITY_LABELS,
  filterCompanyDataEntities,
  type DataEntityKey,
} from '@webonone/platform-nav'
import {
  Button,
  Checkbox,
  Label,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { EditableSectionCard } from './EditableSectionCard'

type CompanyDataEntitiesCardProps = {
  companyId: string
  dataEntities: DataEntityKey[]
  canEdit: boolean
  saving: boolean
}

export function CompanyDataEntitiesCard({
  companyId,
  dataEntities,
  canEdit,
  saving,
}: CompanyDataEntitiesCardProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const detail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DataEntityKey[]>(() => filterCompanyDataEntities(dataEntities))
  const [pendingSave, setPendingSave] = useState(false)
  const sawSavingRef = useRef(false)

  useEffect(() => {
    if (!editing) {
      setDraft(filterCompanyDataEntities(dataEntities))
    }
  }, [dataEntities, editing])

  useEffect(() => {
    if (!pendingSave) {
      sawSavingRef.current = false
      return
    }
    if (detailStatus === 'saving') {
      sawSavingRef.current = true
      return
    }
    if (!sawSavingRef.current) return

    sawSavingRef.current = false
    setPendingSave(false)

    if (detailStatus === 'idle') {
      toast({ title: 'Data services updated' })
      setEditing(false)
      const saved = filterCompanyDataEntities(
        detail?.id === companyId ? (detail.dataEntities ?? []) : draft,
      )
      if (activeCompanyId === companyId) {
        dispatch(
          sessionRoleActions.companyDataEntitiesUpdated({
            companyId,
            dataEntities: saved,
          }),
        )
      }
      return
    }

    if (detailStatus === 'error') {
      toast({
        title: 'Failed to update data services',
        description: detailError ?? undefined,
        variant: 'destructive',
      })
    }
  }, [
    pendingSave,
    detailStatus,
    detailError,
    toast,
    activeCompanyId,
    companyId,
    draft,
    detail,
    dispatch,
  ])

  function toggleEntity(key: DataEntityKey, checked: boolean) {
    setDraft((prev) => {
      if (checked) {
        return COMPANY_DATA_ENTITY_KEYS.filter((item) => item === key || prev.includes(item))
      }
      return prev.filter((item) => item !== key)
    })
  }

  function handleSave() {
    const next = filterCompanyDataEntities(draft)
    setPendingSave(true)
    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id: companyId,
        body: { dataEntities: next },
      }),
    )
  }

  function handleCancel() {
    setDraft(filterCompanyDataEntities(dataEntities))
    setEditing(false)
  }

  const selectedLabels = filterCompanyDataEntities(dataEntities).map(
    (key) => DATA_ENTITY_LABELS[key],
  )

  return (
    <EditableSectionCard
      title="Data services"
      description="Choose which Data catalog sections this company uses. Selected sections appear under Data in the left navigation."
      canEdit={canEdit && !editing}
      onEdit={() => {
        setDraft(filterCompanyDataEntities(dataEntities))
        setEditing(true)
      }}
    >
      {editing ? (
        <div className="space-y-4">
          <ul className="space-y-3">
            {COMPANY_DATA_ENTITY_KEYS.map((key) => {
              const id = `company-data-entity-${key}`
              const checked = draft.includes(key)
              return (
                <li key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={saving}
                    onCheckedChange={(value) => toggleEntity(key, value === true)}
                  />
                  <Label htmlFor={id} className="cursor-pointer font-normal">
                    {DATA_ENTITY_LABELS[key]}
                  </Label>
                </li>
              )
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : selectedLabels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No Data services selected. Edit this section to choose catalog sections for this company.
        </p>
      ) : (
        <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
          {selectedLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      )}
    </EditableSectionCard>
  )
}
