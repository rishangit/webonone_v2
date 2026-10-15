import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AttributePickerListItem,
  Button,
  CustomDialog,
  ItemList,
  ItemListEmpty,
  ListAddButton,
  ListPageActions,
  SearchInput,
  useToast,
} from '@webonone/ui-kit'
import { companyCatalogApi, type CompanyCatalogAttribute } from '../services/companyCatalogApi'
import { CompanyCatalogDataLibraryAttributePickerDialog } from './CompanyCatalogDataLibraryAttributePickerDialog'
import {
  dataLibraryApi,
  parseLibraryAttributes,
  type LibraryCatalogAttribute,
} from '../services/dataLibraryApi'
import type { CatalogGalleryKind } from '../types/companyCatalog.types'

type CompanyCatalogAttributePickerDialogProps = {
  open: boolean
  kind: CatalogGalleryKind
  entityId: string
  libraryEntityId: string | null
  copiedAttributes: CompanyCatalogAttribute[]
  onOpenChange: (open: boolean) => void
  onCopied: (libraryEntityId: string | null) => void
}

function isDeleteBlocked(attr: CompanyCatalogAttribute): boolean {
  return attr.values.some((value) => (value.usedByVariants?.length ?? 0) > 0)
}

export function CompanyCatalogAttributePickerDialog({
  open,
  kind,
  entityId,
  libraryEntityId,
  copiedAttributes,
  onOpenChange,
  onCopied,
}: CompanyCatalogAttributePickerDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [libraryAttributes, setLibraryAttributes] = useState<LibraryCatalogAttribute[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false)
  const copiedIds = useMemo(
    () => new Set(copiedAttributes.map((attr) => attr.attributeId)),
    [copiedAttributes],
  )
  const busy = busyId != null

  useEffect(() => {
    if (!open) return
    setQuery('')
    setError(null)
    if (!libraryEntityId) {
      setLibraryAttributes([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void dataLibraryApi
      .get(kind, libraryEntityId)
      .then((item) => {
        if (cancelled) return
        setLibraryAttributes(parseLibraryAttributes(item.attributes))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLibraryAttributes([])
        setError(err instanceof Error ? err.message : t('attributesTab.failedLoad'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kind, libraryEntityId, open, t])

  const visibleLibrary = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return libraryAttributes
    return libraryAttributes.filter(
      (attr) =>
        attr.name.toLowerCase().includes(q) ||
        (attr.description?.toLowerCase().includes(q) ?? false),
    )
  }, [libraryAttributes, query])

  async function copyIds(attributeIds: string[]) {
    const toCopy = attributeIds.filter((id) => !copiedIds.has(id))
    if (toCopy.length === 0) return
    setBusyId(toCopy[0] ?? 'copy')
    setError(null)
    try {
      const result = await companyCatalogApi.copyAttributesFromLibrary(kind, entityId, toCopy)
      toast({ title: t('attributesTab.copied') })
      onCopied(result.libraryEntityId)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('attributesTab.copyFailed')
      setError(message)
      toast({ title: t('attributesTab.copyFailed'), description: message, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  async function removeAttribute(attributeId: string) {
    setBusyId(attributeId)
    setError(null)
    try {
      await companyCatalogApi.deleteCopiedAttribute(kind, entityId, attributeId)
      toast({ title: t('attributesTab.removed') })
      onCopied(libraryEntityId)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('attributesTab.removeFailed')
      setError(message)
      toast({ title: t('attributesTab.removeFailed'), description: message, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleAttachedToLibrary(nextLibraryId: string) {
    setLibraryPickerOpen(false)
    setBusyId('attach')
    setError(null)
    try {
      const item = await dataLibraryApi.get(kind, nextLibraryId)
      setLibraryAttributes(parseLibraryAttributes(item.attributes))
      onCopied(nextLibraryId)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('attributesTab.failedLoad')
      setError(message)
      onCopied(nextLibraryId)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('attributesTab.addTitle')}
      description={t('attributesTab.addDescription')}
      sizeWidth="xlarge"
      sizeHeight="large"
      nestedDismissGuard={libraryPickerOpen}
      footer={
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={() => onOpenChange(false)}
          disabled={busy}
        >
          {tc('close')}
        </Button>
      }
    >
      <div className="flex min-h-0 flex-col gap-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2 md:grid-rows-[auto_auto_minmax(0,1fr)]">
          <p className="text-sm font-medium text-foreground md:col-start-1 md:row-start-1">
            {t('attributesTab.libraryColumn')}
          </p>
          <ListPageActions className="shrink-0 md:col-start-1 md:row-start-2">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
              placeholder={t('attributesTab.search')}
              aria-label={t('attributesTab.search')}
              className="w-64"
              disabled={busy}
            />
            <ListAddButton disabled={busy} onClick={() => setLibraryPickerOpen(true)}>
              {t('attributesTab.addNewAttribute')}
            </ListAddButton>
          </ListPageActions>
          <div className="min-h-0 md:col-start-1 md:row-start-3">
            {loading ? (
              <ItemListEmpty>{t('attributesTab.loading')}</ItemListEmpty>
            ) : visibleLibrary.length === 0 ? (
              <ItemListEmpty>{t('attributesTab.pickerEmpty')}</ItemListEmpty>
            ) : (
              <ItemList className="min-h-0 overflow-y-auto py-0">
                {visibleLibrary.map((attr) => {
                  const alreadyCopied = copiedIds.has(attr.attributeId)
                  return (
                    <AttributePickerListItem
                      key={attr.attributeId}
                      name={attr.name}
                      description={attr.description}
                      valueTypeLabel={
                        attr.valueType === 'number'
                          ? t('attributesTab.valueTypeNumber')
                          : t('attributesTab.valueTypeText')
                      }
                      unit={attr.unit}
                      noUnitLabel={t('attributesTab.noUnit')}
                      extra={t('attributesTab.valueCount', { count: attr.values.length })}
                      selected={alreadyCopied}
                      trailing={
                        alreadyCopied ? undefined : (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="ml-auto shrink-0"
                            disabled={busy}
                            aria-label={t('attributesTab.addOne', { name: attr.name })}
                            onClick={() => void copyIds([attr.attributeId])}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                          </Button>
                        )
                      }
                    />
                  )
                })}
              </ItemList>
            )}
          </div>
          <p className="text-sm font-medium text-foreground md:col-start-2 md:row-start-1">
            {t('attributesTab.companyColumn')}
          </p>
          <div className="hidden md:block md:col-start-2 md:row-start-2" aria-hidden />
          <div className="min-h-0 md:col-start-2 md:row-start-3">
            {copiedAttributes.length === 0 ? (
              <ItemListEmpty>{t('attributesTab.companyColumnEmpty')}</ItemListEmpty>
            ) : (
              <ItemList className="min-h-0 overflow-y-auto py-0">
                {copiedAttributes.map((attr) => {
                  const blocked = isDeleteBlocked(attr)
                  return (
                    <AttributePickerListItem
                      key={attr.attributeId}
                      name={attr.name}
                      description={attr.description}
                      valueTypeLabel={
                        attr.valueType === 'number'
                          ? t('attributesTab.valueTypeNumber')
                          : t('attributesTab.valueTypeText')
                      }
                      unit={attr.unit}
                      noUnitLabel={t('attributesTab.noUnit')}
                      extra={t('attributesTab.valueCount', { count: attr.values.length })}
                      trailing={
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="ml-auto shrink-0 text-destructive hover:text-destructive"
                          disabled={busy || blocked}
                          aria-label={t('attributesTab.removeOne', { name: attr.name })}
                          onClick={() => void removeAttribute(attr.attributeId)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      }
                    />
                  )
                })}
              </ItemList>
            )}
          </div>
        </div>
      </div>
    </CustomDialog>
    <CompanyCatalogDataLibraryAttributePickerDialog
      open={libraryPickerOpen}
      kind={kind}
      entityId={entityId}
      excludedAttributeIds={libraryAttributes.map((attr) => attr.attributeId)}
      onOpenChange={setLibraryPickerOpen}
      onAttached={(nextLibraryId) => void handleAttachedToLibrary(nextLibraryId)}
    />
    </>
  )
}
