import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  CustomDialog,
  FormField,
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
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import type { CatalogEntityKind, CatalogPayload } from '@/features/sales/types/catalog.types'

type CatalogKind = Extract<CatalogEntityKind, 'products' | 'spaces'>
type AddPhase = 'source' | 'library' | 'create'

function defaultPayload(): CatalogPayload {
  return { name: '', description: '' }
}

export function CompanyCatalogFormDialog({
  open,
  kind,
  mode,
  entityId,
  initialPayload,
  includeSourceStep = false,
  excludeLibraryIds = [],
  onOpenChange,
  onSaved,
}: {
  open: boolean
  kind: CatalogKind
  mode: 'create' | 'edit'
  entityId?: string
  initialPayload?: CatalogPayload | null
  includeSourceStep?: boolean
  excludeLibraryIds?: string[]
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const showSource = mode === 'create' && includeSourceStep
  const noun = t(`entities.${kind === 'products' ? 'product' : 'space'}`)

  const [phase, setPhase] = useState<AddPhase>(showSource ? 'source' : 'create')
  const [source, setSource] = useState<CatalogAddSource | null>(null)
  const [values, setValues] = useState<CatalogPayload>(() => defaultPayload())
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [librarySelectedId, setLibrarySelectedId] = useState<string | null>(null)
  const [librarySelected, setLibrarySelected] = useState<{ id: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [libraryCreateOpen, setLibraryCreateOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setFieldError(null)
    setSource(null)
    setPhase(showSource ? 'source' : 'create')
    setLibrarySelected(null)
    setLibrarySelectedId(null)
    setValues(initialPayload ? { ...defaultPayload(), ...initialPayload } : defaultPayload())
  }, [open, initialPayload, showSource])

  const title = useMemo(() => {
    if (phase === 'library') return `Add ${kind} from library`
    if (phase === 'source') return t('list.add', { noun })
    return mode === 'create' ? `Create company ${noun}` : `Edit company ${noun}`
  }, [kind, mode, noun, phase, t])

  async function savePayload(payload: CatalogPayload, editId?: string) {
    setSaving(true)
    try {
      if (mode === 'create') {
        await companyCatalogApi.createCustom(kind, payload)
        toast({ title: tc('create') })
      } else if (editId) {
        await companyCatalogApi.update(kind, editId, payload)
        toast({ title: tc('save') })
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast({
        title: mode === 'create' ? tc('create') : tc('save'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function buildPayloadFromValues(): CatalogPayload | null {
    const name = typeof values.name === 'string' ? values.name.trim() : ''
    if (!name) {
      setFieldError('Name is required')
      return null
    }
    setFieldError(null)
    const payload: CatalogPayload = {
      ...values,
      name,
      description:
        typeof values.description === 'string' && values.description.trim()
          ? values.description.trim()
          : null,
    }
    const raw = values.listPrice
    if (raw == null || raw === '') {
      payload.listPrice = null
    } else {
      const parsed = Number(raw)
      payload.listPrice = Number.isFinite(parsed) ? parsed : null
    }
    return payload
  }

  async function handleSubmit() {
    const payload = buildPayloadFromValues()
    if (!payload) return
    await savePayload(payload, mode === 'edit' ? entityId : undefined)
  }

  async function handleLibraryPick() {
    if (!librarySelected) return
    setSaving(true)
    try {
      const pick = buildLibraryPick(kind, librarySelected as import('@/features/sales/services/dataLibraryApi').LibraryListItem, 'linked')
      await companyCatalogApi.fromLibrary(kind, pick)
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

  const formBody = (
    <View className="gap-4">
      {fieldError ? <Body className="text-destructive">{fieldError}</Body> : null}
      <FormField label={tc('name')} required>
        <TextField
          value={typeof values.name === 'string' ? values.name : ''}
          onChangeText={(name) => setValues((prev) => ({ ...prev, name }))}
        />
      </FormField>
      <FormField label={tc('description')}>
        <Textarea
          value={typeof values.description === 'string' ? values.description : ''}
          onChangeText={(description) => setValues((prev) => ({ ...prev, description }))}
        />
      </FormField>
      <FormField label="List price (LKR)">
        <TextField
          value={
            typeof values.listPrice === 'number'
              ? String(values.listPrice)
              : typeof values.listPrice === 'string'
                ? values.listPrice
                : ''
          }
          onChangeText={(listPrice) =>
            setValues((prev) => ({
              ...prev,
              listPrice: listPrice.trim() === '' ? null : listPrice,
            }))
          }
          keyboardType="decimal-pad"
        />
      </FormField>
    </View>
  )

  const body =
    phase === 'source' ? (
      <CatalogWizardStepSource value={source} onChange={setSource} entityLabel={noun} />
    ) : phase === 'library' ? (
      <LibraryPickerPanel
        active={open && phase === 'library'}
        kind={kind}
        excludeLibraryIds={excludeLibraryIds}
        selectedId={librarySelectedId}
        onSelectedChange={(item) => {
          setLibrarySelected(item)
          setLibrarySelectedId(item?.id ?? null)
        }}
        onCreateOpenChange={setLibraryCreateOpen}
      />
    ) : (
      formBody
    )

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      sizeWidth={phase === 'library' || phase === 'source' ? 'large' : 'medium'}
      sizeHeight="large"
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
            {showSource ? (
              <Button variant="outline" onPress={() => setPhase('source')} disabled={saving}>
                Previous
              </Button>
            ) : null}
            <Button onPress={() => void handleSubmit()} disabled={saving}>
              {mode === 'create' ? tc('create') : tc('save')}
            </Button>
          </>
        )
      }
    >
      {body}
    </CustomDialog>
  )
}
