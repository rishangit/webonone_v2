import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { subscribeAiCatalogMutation } from '@/features/ai/utils/aiCatalogEvents'
import { isCompanyCatalogWriteTool } from '@/features/ai/utils/catalogAiMutationRefresh'
import { CompanyCatalogList } from '@/features/data/components/CompanyCatalogList'
import { CompanyCatalogFormDialog } from '@/features/data/company-catalog/components/CompanyCatalogFormDialog'
import { CompanyServiceFormDialog } from '@/features/data/company-catalog/components/CompanyServiceFormDialog'
import { useDataCatalogScope } from '@/features/data/hooks/useDataCatalogScope'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import { catalogDetailPath, type CatalogKind } from '@/features/data/utils/dataPaths'
import { hydrateCatalogItems } from '@/features/sales/utils/hydrateCatalogItems'
import type { HydratedCatalogItem } from '@/features/sales/types/catalog.types'
import { useClientInfiniteList } from '@/shared/hooks/useClientInfiniteList'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'

const ENTITY_SINGULAR: Record<CatalogKind, 'product' | 'service' | 'space'> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

export function CompanyCatalogListScreen({ kind }: { kind: CatalogKind }) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManageCompanyCatalog } = useDataCatalogScope()
  const entity = t(`entities.${kind}`)
  const noun = t(`entities.${ENTITY_SINGULAR[kind]}`)
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<HydratedCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.list(kind, {
        q: searchQuery.trim() || undefined,
      })
      setItems(await hydrateCatalogItems(kind, result.items ?? []))
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : t('list.loading', { entity }))
    } finally {
      setLoading(false)
    }
  }, [kind, searchQuery, t, entity])

  useEffect(() => {
    const handle = setTimeout(() => {
      void load()
    }, 250)
    return () => clearTimeout(handle)
  }, [load])

  useEffect(() => {
    return subscribeAiCatalogMutation((toolName) => {
      if (isCompanyCatalogWriteTool(toolName)) {
        void load()
      }
    })
  }, [load])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.displayName.toLowerCase().includes(q) ||
        (item.displayDescription?.toLowerCase().includes(q) ?? false),
    )
  }, [items, searchQuery])

  const excludeLibraryIds = useMemo(
    () =>
      items
        .map((item) => item.libraryEntityId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [items],
  )

  const pagination = useClientInfiniteList(filtered, 12, searchQuery)
  const onScroll = useListPageScroll(pagination)

  async function handleRemove(item: HydratedCatalogItem) {
    setBusyId(item.id)
    try {
      await companyCatalogApi.remove(kind, item.id)
      toast({ title: tc('remove') })
      await load()
    } catch (err) {
      toast({
        title: tc('remove'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const emptyMessage = searchQuery.trim()
    ? t('list.emptySearch', { entity })
    : t('list.empty', { entity })

  return (
    <>
      <FeatureScreen
        title={entity}
        description={t('list.description', { entity })}
        onScroll={onScroll}
        actions={
          <ListPageActions>
            <SearchInput
              placeholder={t('list.searchPlaceholder', { entity })}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={searchQuery ? () => setSearchQuery('') : undefined}
              accessibilityLabel={t('list.searchAria', { entity })}
            />
            {canManageCompanyCatalog ? (
              <ListAddButton onPress={() => setAddOpen(true)}>
                {t('list.add', { noun })}
              </ListAddButton>
            ) : null}
          </ListPageActions>
        }
      >
        {loading ? <Spinner label={t('list.loading', { entity })} /> : null}
        {error ? <Body className="text-destructive">{error}</Body> : null}

        {!loading ? (
          <ListPageBody>
            <CompanyCatalogList
              kind={kind}
              items={pagination.visibleItems}
              busyId={busyId}
              canRemove={canManageCompanyCatalog}
              removeNoun={noun}
              onOpen={(item) => router.push(catalogDetailPath(kind, item.id) as Href)}
              onRemove={(item) => void handleRemove(item)}
              emptyMessage={emptyMessage}
            />
            <TranslatedListPageFooter
              loadedCount={pagination.loadedCount}
              totalCount={pagination.totalCount}
              hasMore={pagination.hasMore}
              loadingMore={pagination.loadingMore}
            />
          </ListPageBody>
        ) : null}
      </FeatureScreen>

      {kind === 'services' ? (
        <CompanyServiceFormDialog
          open={addOpen}
          includeSourceStep
          excludeLibraryIds={excludeLibraryIds}
          onOpenChange={setAddOpen}
          onSaved={() => void load()}
        />
      ) : (
        <CompanyCatalogFormDialog
          open={addOpen}
          kind={kind}
          mode="create"
          includeSourceStep
          excludeLibraryIds={excludeLibraryIds}
          onOpenChange={setAddOpen}
          onSaved={() => void load()}
        />
      )}
    </>
  )
}
