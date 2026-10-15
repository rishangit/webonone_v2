import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PLATFORM_MESSAGE_TYPES } from '@webonone/platform-embed'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListAddButton,
  ListPageActions,
  SearchInput,
  itemListRowActiveClassName,
  useToast,
  cn,
} from '@webonone/ui-kit'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { usePlatformPeerDialog } from '@/features/shell/PlatformPeerDialogContext'
import { companyCatalogApi, type CompanyCatalogVariant } from '../services/companyCatalogApi'
import { dataLibraryApi, type LibraryProductVariant } from '../services/dataLibraryApi'
import { VariantPickerItemDetails } from './VariantPickerItemDetails'

type CompanyProductVariantPickerDialogProps = {
  open: boolean
  productId: string
  libraryEntityId: string | null
  copiedVariants: CompanyCatalogVariant[]
  onOpenChange: (open: boolean) => void
  onCopied: (libraryEntityId: string | null) => void
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `variant-picker-${Date.now()}`
}

function variantMatchesQuery(name: string, sku: string, query: string): boolean {
  return name.toLowerCase().includes(query) || sku.toLowerCase().includes(query)
}

export function CompanyProductVariantPickerDialog({
  open,
  productId,
  libraryEntityId,
  copiedVariants,
  onOpenChange,
  onCopied,
}: CompanyProductVariantPickerDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { openPeerDialog } = usePlatformPeerDialog()
  const [query, setQuery] = useState('')
  const [libraryVariants, setLibraryVariants] = useState<LibraryProductVariant[]>([])
  const [linkedLibraryId, setLinkedLibraryId] = useState<string | null>(libraryEntityId)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copiedIds = useMemo(
    () => new Set(copiedVariants.map((variant) => variant.libraryVariantId)),
    [copiedVariants],
  )
  const busy = busyId != null || creating

  async function loadLibraryVariants(libraryId: string) {
    const result = await dataLibraryApi.listProductVariants(libraryId)
    setLibraryVariants(result.items)
  }

  useEffect(() => {
    if (!open) return
    setQuery('')
    setError(null)
    setLinkedLibraryId(libraryEntityId)
    if (!libraryEntityId) {
      setLibraryVariants([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void dataLibraryApi
      .listProductVariants(libraryEntityId)
      .then((result) => {
        if (cancelled) return
        setLibraryVariants(result.items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLibraryVariants([])
        setError(err instanceof Error ? err.message : t('variantsTab.failedLoad'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [libraryEntityId, open, t])

  const visibleLibrary = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return libraryVariants
    return libraryVariants.filter((variant) => variantMatchesQuery(variant.name, variant.sku, q))
  }, [libraryVariants, query])

  async function copyIds(libraryVariantIds: string[]) {
    const toCopy = libraryVariantIds.filter((id) => !copiedIds.has(id))
    if (toCopy.length === 0) return
    setBusyId(toCopy[0] ?? 'copy')
    setError(null)
    try {
      const result = await companyCatalogApi.copyVariantsFromLibrary(productId, toCopy)
      toast({ title: t('variantsTab.copied') })
      if (result.libraryEntityId) setLinkedLibraryId(result.libraryEntityId)
      onCopied(result.libraryEntityId)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('variantsTab.copyFailed')
      setError(message)
      toast({ title: t('variantsTab.copyFailed'), description: message, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  async function removeVariant(variant: CompanyCatalogVariant) {
    if (variant.isDefault) return
    setBusyId(variant.id)
    setError(null)
    try {
      await companyCatalogApi.deleteCopiedVariant(productId, variant.id)
      toast({ title: t('variantsTab.removed') })
      onCopied(linkedLibraryId)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('variantsTab.removeFailed')
      setError(message)
      toast({ title: t('variantsTab.removeFailed'), description: message, variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  async function refreshLibrary(libraryId: string) {
    setBusyId('refresh')
    setError(null)
    try {
      await loadLibraryVariants(libraryId)
      onCopied(libraryId)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('variantsTab.failedLoad')
      setError(message)
      onCopied(libraryId)
    } finally {
      setBusyId(null)
    }
  }

  function openCreateVariant() {
    void (async () => {
      setBusyId('create')
      setError(null)
      try {
        const libraryId =
          linkedLibraryId ??
          (await companyCatalogApi.ensureLibraryLink('products', productId)).libraryEntityId
        setLinkedLibraryId(libraryId)
        setCreating(true)
        openPeerDialog(
          {
            type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST,
            requestId: createRequestId(),
            path: `/embed/dialogs/products/${libraryId}/variants/create`,
            title: t('variantsTab.addNewVariant'),
            description: t('variantsTab.addNewVariantDescription'),
            submitLabel: t('variantsTab.createVariant'),
            cancelLabel: tc('cancel'),
            sizeWidth: 'medium',
            sizeHeight: 'large',
          },
          {
            resolve: () => {
              setCreating(false)
              void refreshLibrary(libraryId)
            },
            cancel: () => setCreating(false),
          },
          getDataOrigin().replace(/\/$/, ''),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : t('variantsTab.copyFailed')
        setError(message)
        toast({ title: t('variantsTab.copyFailed'), description: message, variant: 'destructive' })
      } finally {
        setBusyId(null)
      }
    })()
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('variantsTab.addTitle')}
      description={t('variantsTab.addDescription')}
      sizeWidth="xlarge"
      sizeHeight="large"
      nestedDismissGuard={creating}
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
            {t('variantsTab.libraryColumn')}
          </p>
          <ListPageActions className="shrink-0 md:col-start-1 md:row-start-2">
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
              placeholder={t('variantsTab.search')}
              aria-label={t('variantsTab.search')}
              className="w-64"
              disabled={busy}
            />
            <ListAddButton disabled={busy} onClick={openCreateVariant}>
              {t('variantsTab.addNewVariant')}
            </ListAddButton>
          </ListPageActions>
          <div className="min-h-0 md:col-start-1 md:row-start-3">
            {loading ? (
              <ItemListEmpty>{t('variantsTab.loading')}</ItemListEmpty>
            ) : visibleLibrary.length === 0 ? (
              <ItemListEmpty>
                {linkedLibraryId ? t('variantsTab.pickerEmpty') : t('variantsTab.noLibraryProduct')}
              </ItemListEmpty>
            ) : (
              <ItemList className="min-h-0 overflow-y-auto py-0">
                {visibleLibrary.map((variant) => {
                  const alreadyCopied = copiedIds.has(variant.id)
                  return (
                    <ItemListItem
                      key={variant.id}
                      className={cn(alreadyCopied && itemListRowActiveClassName)}
                    >
                      <ItemListContent>
                        <p className="truncate font-medium">{variant.name}</p>
                        <VariantPickerItemDetails
                          sku={variant.sku}
                          isDefault={variant.isDefault}
                          values={variant.values}
                        />
                      </ItemListContent>
                      {alreadyCopied ? (
                        <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="ml-auto shrink-0"
                          disabled={busy}
                          aria-label={t('variantsTab.addOne', { name: variant.name })}
                          onClick={() => void copyIds([variant.id])}
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </Button>
                      )}
                    </ItemListItem>
                  )
                })}
              </ItemList>
            )}
          </div>
          <p className="text-sm font-medium text-foreground md:col-start-2 md:row-start-1">
            {t('variantsTab.companyColumn')}
          </p>
          <div className="hidden md:block md:col-start-2 md:row-start-2" aria-hidden />
          <div className="min-h-0 md:col-start-2 md:row-start-3">
            {copiedVariants.length === 0 ? (
              <ItemListEmpty>{t('variantsTab.companyColumnEmpty')}</ItemListEmpty>
            ) : (
              <ItemList className="min-h-0 overflow-y-auto py-0">
                {copiedVariants.map((variant) => (
                  <ItemListItem key={variant.id}>
                    <ItemListContent>
                      <p className="truncate font-medium">{variant.name}</p>
                      <VariantPickerItemDetails
                        sku={variant.sku}
                        isDefault={variant.isDefault}
                        values={variant.values}
                      />
                    </ItemListContent>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="ml-auto shrink-0 text-destructive hover:text-destructive"
                      disabled={busy || variant.isDefault}
                      aria-label={t('variantsTab.removeOne', { name: variant.name })}
                      onClick={() => void removeVariant(variant)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </div>
        </div>
      </div>
    </CustomDialog>
  )
}
