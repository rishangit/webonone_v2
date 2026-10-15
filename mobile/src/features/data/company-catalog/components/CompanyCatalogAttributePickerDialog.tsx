import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Check, Plus, Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Body,
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListAddButton,
  ListPageActions,
  SearchInput,
  useToast,
} from '@webonone/mobile-ui'
import {
  companyCatalogApi,
  type CompanyCatalogAttribute,
} from '@/features/data/services/companyCatalogApi'
import { CompanyCatalogDataLibraryAttributePickerDialog } from './CompanyCatalogDataLibraryAttributePickerDialog'
import {
  dataLibraryApi,
  parseLibraryAttributes,
  type LibraryCatalogAttribute,
} from '@/features/sales/services/dataLibraryApi'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

function attributePickerSubtitle(
  t: TFunction<'catalog'>,
  attr: {
    description: string | null
    valueType: 'number' | 'text'
    unit: { name: string; symbol: string } | null
    values: unknown[]
  },
): string {
  const meta = [
    attr.valueType === 'number' ? t('attributesTab.valueTypeNumber') : t('attributesTab.valueTypeText'),
    attr.unit ? `${attr.unit.name} (${attr.unit.symbol})` : t('attributesTab.noUnit'),
    t('attributesTab.valueCount', { count: attr.values.length }),
  ].join(' · ')
  return [attr.description, meta].filter(Boolean).join('\n')
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
}: {
  open: boolean
  kind: CatalogKind
  entityId: string
  libraryEntityId: string | null
  copiedAttributes: CompanyCatalogAttribute[]
  onOpenChange: (open: boolean) => void
  onCopied: () => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [libraryAttributes, setLibraryAttributes] = useState<LibraryCatalogAttribute[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false)
  const copiedIds = useMemo(
    () => new Set(copiedAttributes.map((attr) => attr.attributeId)),
    [copiedAttributes],
  )
  const busy = busyId != null

  useEffect(() => {
    if (!open) return
    setQuery('')
    if (!libraryEntityId) {
      setLibraryAttributes([])
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
      .catch(() => {
        if (!cancelled) setLibraryAttributes([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kind, libraryEntityId, open])

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
    try {
      await companyCatalogApi.copyAttributesFromLibrary(kind, entityId, toCopy)
      toast({ title: t('attributesTab.copied') })
      onCopied()
    } catch (err) {
      toast({
        title: t('attributesTab.copyFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function removeAttribute(attributeId: string) {
    setBusyId(attributeId)
    try {
      await companyCatalogApi.deleteCopiedAttribute(kind, entityId, attributeId)
      toast({ title: t('attributesTab.removed') })
      onCopied()
    } catch (err) {
      toast({
        title: t('attributesTab.removeFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleAttachedToLibrary(nextLibraryId: string) {
    setLibraryPickerOpen(false)
    setBusyId('attach')
    try {
      const item = await dataLibraryApi.get(kind, nextLibraryId)
      setLibraryAttributes(parseLibraryAttributes(item.attributes))
      onCopied()
    } catch {
      onCopied()
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
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onPress={() => onOpenChange(false)} disabled={busy}>
              {tc('close')}
            </Button>
          </View>
        }
      >
        <View className="gap-3">
          <View className="flex-col gap-4 sm:flex-row sm:items-start">
            <View className="min-w-0 flex-1 gap-2">
              <Body className="font-medium">{t('attributesTab.libraryColumn')}</Body>
              <ListPageActions>
                <SearchInput
                  value={query}
                  onChangeText={setQuery}
                  onClear={() => setQuery('')}
                  placeholder={t('attributesTab.search')}
                  editable={!busy}
                />
                <ListAddButton disabled={busy} onPress={() => setLibraryPickerOpen(true)}>
                  {t('attributesTab.addNewAttribute')}
                </ListAddButton>
              </ListPageActions>
              {loading ? (
                <ItemListEmpty>{t('attributesTab.loading')}</ItemListEmpty>
              ) : visibleLibrary.length === 0 ? (
                <ItemListEmpty>{t('attributesTab.pickerEmpty')}</ItemListEmpty>
              ) : (
                <ItemList>
                  {visibleLibrary.map((attr) => {
                    const alreadyCopied = copiedIds.has(attr.attributeId)
                    return (
                      <ItemListItem key={attr.attributeId}>
                        <ItemListContent
                          title={attr.name}
                          subtitle={attributePickerSubtitle(t, attr)}
                        />
                        {alreadyCopied ? (
                          <Check size={20} />
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={busy}
                            accessibilityLabel={t('attributesTab.addOne', { name: attr.name })}
                            onPress={() => void copyIds([attr.attributeId])}
                          >
                            <Plus size={20} />
                          </Button>
                        )}
                      </ItemListItem>
                    )
                  })}
                </ItemList>
              )}
            </View>
            <View className="min-w-0 flex-1 gap-2">
              <Body className="font-medium">{t('attributesTab.companyColumn')}</Body>
              <View className="hidden h-12 sm:flex" aria-hidden />
              {copiedAttributes.length === 0 ? (
                <ItemListEmpty>{t('attributesTab.companyColumnEmpty')}</ItemListEmpty>
              ) : (
                <ItemList>
                  {copiedAttributes.map((attr) => {
                    const blocked = isDeleteBlocked(attr)
                    return (
                      <ItemListItem key={attr.attributeId}>
                        <ItemListContent
                          title={attr.name}
                          subtitle={attributePickerSubtitle(t, attr)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={busy || blocked}
                          accessibilityLabel={t('attributesTab.removeOne', { name: attr.name })}
                          onPress={() => void removeAttribute(attr.attributeId)}
                        >
                          <Trash2 size={20} />
                        </Button>
                      </ItemListItem>
                    )
                  })}
                </ItemList>
              )}
            </View>
          </View>
        </View>
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
