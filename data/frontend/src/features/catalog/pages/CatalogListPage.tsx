import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListAddButton,
  FormField,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  SearchInput,
  ListPageFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { CatalogFormDialog } from '@/features/catalog/components/CatalogFormDialog'
import { CatalogList } from '@/features/catalog/components/CatalogList'
import { ProductFormDialog } from '@/features/products/components/ProductFormDialog'
import { productsActions } from '@/features/products/store'
import { ServiceFormDialog } from '@/features/services/components/ServiceFormDialog'
import { servicesActions } from '@/features/services/store'
import { spacesActions } from '@/features/spaces/store'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import type { CatalogFeatureState } from '@webonone/store-kit'
import type { CatalogItem } from '@/shared/types/data.types'

type CatalogKind = 'products' | 'services' | 'spaces'

const CONFIG: Record<
  CatalogKind,
  {
    select: (s: RootState) => CatalogFeatureState<CatalogItem>
    actions: typeof productsActions
    deleteAction: (id: string) => ReturnType<typeof productsActions.deleteRequested>
  }
> = {
  products: {
    select: (s) => s.products,
    actions: productsActions,
    deleteAction: (id) => productsActions.deleteRequested({ id }),
  },
  services: {
    select: (s) => s.services,
    actions: servicesActions,
    deleteAction: (id) => servicesActions.deleteRequested({ id }),
  },
  spaces: {
    select: (s) => s.spaces,
    actions: spacesActions,
    deleteAction: (id) => spacesActions.deleteRequested({ id }),
  },
}

export function CatalogListPage({ kind }: { kind: CatalogKind }) {
  const { t } = useTranslation(kind)
  const { t: tc } = useTranslation('common')
  const config = CONFIG[kind]
  const { goToDetail } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canCreate = user?.role === 'super_admin' || user?.role === 'company_admin'
  const canEdit = canCreate
  const canDelete = user?.role === 'super_admin'
  const [dialog, setDialog] = useState<{ id?: string } | null>(null)

  const list = useEpicCatalogList(config.select, config.actions)
  usePlatformLoading(list.loading ? t('loading') : null)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title={t('title')}
      description={t('description')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder={t('search')}
            className="w-64"
            aria-label={t('search')}
          />
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
          {canCreate ? (
            <ListAddButton onClick={() => setDialog({})} compactLabel={tc('add')}>
              {t('add')}
            </ListAddButton>
          ) : null}
        </div>
      }
    >
      <ListFilterPanel
        open={list.filterOpen}
        onOpenChange={list.setFilterOpen}
        onApply={() => list.load(1, list.pageSize, true)}
        onClear={() => {
          list.setStatus('all')
          list.load(1, list.pageSize, true)
        }}
      >
        <FormField label={tc('status')} htmlFor={`${kind}-status`}>
          <Select value={list.status} onValueChange={list.setStatus}>
            <SelectTrigger id={`${kind}-status`}>
              <SelectValue placeholder={tc('all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('all')}</SelectItem>
              <SelectItem value="verified">{t('verified')}</SelectItem>
              <SelectItem value="pending">{t('unverified')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!list.loading ? (
            <CatalogList
              itemType={kind}
              items={list.items}
              onEdit={(id) => setDialog({ id })}
              onDeleted={(id) => {
                dispatch(config.deleteAction(id))
                list.load(list.page, list.pageSize, true)
              }}
              onVerify={(id) => {
                dispatch(config.actions.saveDetailRequested({ id, body: { status: 'verified' } }))
                list.load(list.page, list.pageSize, true)
              }}
              onView={(id) => goToDetail(kind, id)}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ) : null}
        </div>
        <ListPageFooter
          className="mt-auto"
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          pageSizeOptions={[12, 24, 48]}
          loadedCount={list.items.length}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          onPageChange={(p) => list.load(p)}
          onPageSizeChange={(size) => list.load(1, size, true)}
          onLoadMore={list.loadMore}
          onModeChange={() => list.load(1, list.pageSize, true)}
        />
      </ListPageBody>

      {dialog !== null && kind === 'products' ? (
        <ProductFormDialog
          open
          id={dialog.id}
          onOpenChange={(o) => {
            if (!o) setDialog(null)
          }}
          onSaved={() => {
            list.load(list.page, list.pageSize, true)
            setDialog(null)
          }}
        />
      ) : null}

      {dialog !== null && kind === 'services' ? (
        <ServiceFormDialog
          open
          id={dialog.id}
          onOpenChange={(o) => {
            if (!o) setDialog(null)
          }}
          onSaved={() => {
            list.load(list.page, list.pageSize, true)
            setDialog(null)
          }}
        />
      ) : null}

      {dialog !== null && kind === 'spaces' ? (
        <CatalogFormDialog
          kind="spaces"
          open
          id={dialog.id}
          onOpenChange={(o) => {
            if (!o) setDialog(null)
          }}
          onSaved={() => {
            list.load(list.page, list.pageSize, true)
            setDialog(null)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
