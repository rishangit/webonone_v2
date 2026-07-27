import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  ColorInput,
  CustomDialog,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  CatalogWizardStepSource,
  type CatalogAddSource,
} from '@/features/company-catalog/components/CatalogWizardStepSource'
import {
  buildLibraryPick,
  LibraryPickerPanel,
} from '@/features/company-catalog/components/LibraryPickerPanel'
import type { LibraryListItem } from '@/features/company-catalog/services/dataLibraryApi'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import { randomTagColor } from '@/features/company-catalog/utils/randomTagColor'
import {
  CATALOG_ENTITY_LABELS,
  singularLabel,
  type CatalogEntityKind,
  type CatalogPayload,
} from '../types/companyCatalog.types'

type NonServiceCatalogKind = Exclude<CatalogEntityKind, 'services'>
type AddPhase = 'source' | 'library' | 'create'

type CatalogFormDialogProps = {
  open: boolean
  kind: NonServiceCatalogKind
  mode: 'create' | 'edit'
  initialPayload?: CatalogPayload | null
  includeSourceStep?: boolean
  excludeLibraryIds?: string[]
  onOpenChange: (open: boolean) => void
  onSubmit?: (payload: CatalogPayload) => void
  onSaved?: () => void
  busy?: boolean
  error?: string | null
}

function defaultPayload(kind: NonServiceCatalogKind): CatalogPayload {
  switch (kind) {
    case 'tags':
      return { name: '', description: '', color: randomTagColor() }
    case 'units':
      return { name: '', description: '', symbol: '', isBase: true, baseUnitId: null }
    case 'attributes':
      return { name: '', description: '', valueType: 'text', unitId: null }
    case 'products':
    case 'spaces':
      return { name: '', description: '' }
  }
}

export function CatalogFormDialog({
  open,
  kind,
  mode,
  initialPayload,
  includeSourceStep = false,
  excludeLibraryIds = [],
  onOpenChange,
  onSubmit,
  onSaved,
  busy: busyProp,
  error: errorProp,
}: CatalogFormDialogProps) {
  const dispatch = useAppDispatch()
  const mutateStatus = useAppSelector((s) => s.companyCatalog.mutateStatus)
  const mutateError = useAppSelector((s) => s.companyCatalog.mutateError)

  const showSource = mode === 'create' && includeSourceStep
  const ownsMutate = showSource || Boolean(onSaved)

  const busy = ownsMutate ? mutateStatus === 'saving' : Boolean(busyProp)
  const error = ownsMutate ? mutateError : (errorProp ?? null)

  const [phase, setPhase] = useState<AddPhase>(showSource ? 'source' : 'create')
  const [source, setSource] = useState<CatalogAddSource | null>(null)
  const [values, setValues] = useState<CatalogPayload>(() => defaultPayload(kind))
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [librarySelected, setLibrarySelected] = useState<LibraryListItem | null>(null)
  const [libraryCreateOpen, setLibraryCreateOpen] = useState(false)
  const customSubmittedRef = useRef(false)
  const librarySubmittedRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setFieldError(null)
    setSource(null)
    setPhase(showSource ? 'source' : 'create')
    setLibrarySelected(null)
    setLibraryCreateOpen(false)
    customSubmittedRef.current = false
    librarySubmittedRef.current = false
    if (ownsMutate) {
      dispatch(companyCatalogActions.clearMutateError())
    }
    setValues(initialPayload ? { ...defaultPayload(kind), ...initialPayload } : defaultPayload(kind))
  }, [open, kind, initialPayload, showSource, ownsMutate, dispatch])

  useEffect(() => {
    if (!ownsMutate) return
    if (!customSubmittedRef.current && !librarySubmittedRef.current) return
    if (mutateStatus === 'saving') return

    if (mutateError) {
      customSubmittedRef.current = false
      librarySubmittedRef.current = false
      return
    }

    if (mutateStatus === 'idle') {
      customSubmittedRef.current = false
      librarySubmittedRef.current = false
      onSaved?.()
      onOpenChange(false)
    }
  }, [mutateStatus, mutateError, ownsMutate, onOpenChange, onSaved])

  const noun = singularLabel(kind).toLowerCase()
  const pluralLabel = CATALOG_ENTITY_LABELS[kind].toLowerCase()

  const title = useMemo(() => {
    if (phase === 'library') return `Add ${pluralLabel} from library`
    if (phase === 'source') return `Add ${noun}`
    return mode === 'create' ? `Create company ${noun}` : `Edit company ${noun}`
  }, [kind, mode, noun, phase, pluralLabel])

  const description = useMemo(() => {
    if (phase === 'library') {
      return `Select a library ${noun} to link to your company. You can customize it later from the detail page.`
    }
    if (phase === 'source') {
      return `Choose how to add this ${noun}.`
    }
    return `${CATALOG_ENTITY_LABELS[kind]} owned by your company.`
  }, [kind, noun, phase])

  function setField(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSourceNext() {
    if (!source) return
    if (source === 'library') {
      setPhase('library')
      return
    }
    setPhase('create')
  }

  function handlePrevious() {
    if (phase === 'library' || (phase === 'create' && showSource)) {
      setPhase('source')
      setLibrarySelected(null)
      setFieldError(null)
    }
  }

  function handleSubmit() {
    const name = typeof values.name === 'string' ? values.name.trim() : ''
    if (!name) {
      setFieldError('Name is required')
      return
    }
    if (kind === 'tags' && typeof values.color !== 'string') {
      setFieldError('Color is required')
      return
    }
    if (kind === 'units' && !(typeof values.symbol === 'string' && values.symbol.trim())) {
      setFieldError('Symbol is required')
      return
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

    if (ownsMutate) {
      dispatch(companyCatalogActions.clearMutateError())
      customSubmittedRef.current = true
      dispatch(companyCatalogActions.createCustomRequested({ kind, payload }))
      return
    }

    onSubmit?.(payload)
  }

  function handleLibraryPick() {
    if (!librarySelected) return
    dispatch(companyCatalogActions.clearMutateError())
    librarySubmittedRef.current = true
    dispatch(
      companyCatalogActions.fromLibraryRequested({
        kind,
        ...buildLibraryPick(kind, librarySelected, 'linked'),
      }),
    )
  }

  function handleFormOpenChange(next: boolean) {
    if (next) return
    if (libraryCreateOpen) return
    onOpenChange(false)
  }

  const formBody = (
    <div className="flex flex-col gap-4">
      {(error || fieldError) && (
        <Alert variant="destructive">
          <AlertDescription>{error ?? fieldError}</AlertDescription>
        </Alert>
      )}
      <FormField label="Name" htmlFor="catalog-name" required>
        <Input
          id="catalog-name"
          value={typeof values.name === 'string' ? values.name : ''}
          onChange={(e) => setField('name', e.target.value)}
        />
      </FormField>
      <FormField label="Description" htmlFor="catalog-description">
        <Textarea
          id="catalog-description"
          value={typeof values.description === 'string' ? values.description : ''}
          onChange={(e) => setField('description', e.target.value)}
          rows={3}
        />
      </FormField>

      {kind === 'tags' ? (
        <FormField label="Color" htmlFor="catalog-color" required>
          <ColorInput
            id="catalog-color"
            value={typeof values.color === 'string' ? values.color : '#2563EB'}
            onChange={(color) => setField('color', color)}
          />
        </FormField>
      ) : null}

      {kind === 'units' ? (
        <FormField label="Symbol" htmlFor="catalog-symbol" required>
          <Input
            id="catalog-symbol"
            value={typeof values.symbol === 'string' ? values.symbol : ''}
            onChange={(e) => setField('symbol', e.target.value)}
          />
        </FormField>
      ) : null}

      {kind === 'attributes' ? (
        <div className="flex flex-col gap-2">
          <Label>Value type</Label>
          <Select
            value={typeof values.valueType === 'string' ? values.valueType : 'text'}
            onValueChange={(value) => setField('valueType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )

  const body =
    phase === 'source' ? (
      <CatalogWizardStepSource value={source} onChange={setSource} entityLabel={noun} />
    ) : phase === 'library' ? (
      <LibraryPickerPanel
        active={open && phase === 'library'}
        kind={kind}
        excludeLibraryIds={excludeLibraryIds}
        busy={busy}
        error={error}
        onCreateOpenChange={setLibraryCreateOpen}
        onSelectedChange={setLibrarySelected}
      />
    ) : (
      formBody
    )

  const footer =
    phase === 'library' ? (
      <>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={() => handleFormOpenChange(false)}
          disabled={busy || libraryCreateOpen}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={handlePrevious}
          disabled={busy || libraryCreateOpen}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          className="h-10 px-4"
          disabled={!librarySelected || busy || libraryCreateOpen}
          onClick={handleLibraryPick}
        >
          Add
        </Button>
      </>
    ) : phase === 'source' ? (
      <>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={() => handleFormOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="button" className="h-10 px-4" onClick={handleSourceNext} disabled={!source}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </>
    ) : (
      <>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={() => handleFormOpenChange(false)}
          disabled={busy}
        >
          Cancel
        </Button>
        {showSource ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={handlePrevious}
            disabled={busy}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        ) : null}
        <Button type="button" className="h-10 px-4" onClick={handleSubmit} disabled={busy}>
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </>
    )

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleFormOpenChange}
      title={title}
      description={description}
      sizeWidth={phase === 'library' || phase === 'source' ? 'large' : 'medium'}
      sizeHeight={phase === 'library' || phase === 'source' ? 'large' : 'large'}
      nestedDismissGuard={libraryCreateOpen}
      footer={footer}
    >
      {body}
    </CustomDialog>
  )
}
