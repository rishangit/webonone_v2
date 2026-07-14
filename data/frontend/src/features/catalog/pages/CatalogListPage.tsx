import { Link, Navigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  ListSearchField,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { CatalogList } from '@/features/catalog/components/CatalogList'
import { productsActions } from '@/features/products/store'
import { servicesActions } from '@/features/services/store'
import { spacesActions } from '@/features/spaces/store'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import type { CatalogFeatureState } from '@/shared/store/createCatalogFeatureStore'
import type { CatalogItem } from '@/shared/types/data.types'

type CatalogKind = 'products' | 'services' | 'spaces'

const CONFIG: Record<
  CatalogKind,
  {
    title: string
    select: (s: RootState) => CatalogFeatureState<CatalogItem>
    actions: typeof productsActions
    deleteAction: (id: string) => ReturnType<typeof productsActions.deleteRequested>
  }
> = {
  products: {
    title: 'Products',
    select: (s) => s.products,
    actions: productsActions,
    deleteAction: (id) => productsActions.deleteRequested({ id }),
  },
  services: {
    title: 'Services',
    select: (s) => s.services,
    actions: servicesActions,
    deleteAction: (id) => servicesActions.deleteRequested({ id }),
  },
  spaces: {
    title: 'Spaces',
    select: (s) => s.spaces,
    actions: spacesActions,
    deleteAction: (id) => spacesActions.deleteRequested({ id }),
  },
}

export function CatalogListPage({ kind }: { kind: CatalogKind }) {
  const config = CONFIG[kind]
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canMutate = user?.role === 'super_admin'

  const list = useEpicCatalogList(config.select, config.actions)
  usePlatformLoading(list.loading ? `Loading ${kind}…` : null)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title={config.title}
      description={`Manage catalog ${kind}.`}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <ListSearchField value={list.q} onChange={list.setQ} placeholder={`Search ${kind}…`} />
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
          {canMutate ? (
            <Button asChild>
              <Link to={`/${kind}/new`}>Add new</Link>
            </Button>
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
        <FormField label="Status" htmlFor={`${kind}-status`}>
          <Select value={list.status} onValueChange={list.setStatus}>
            <SelectTrigger id={`${kind}-status`}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
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
              basePath={`/${kind}`}
              itemType={kind}
              items={list.items}
              onDeleted={(id) => {
                dispatch(config.deleteAction(id))
                list.load(list.page, list.pageSize, true)
              }}
              canMutate={canMutate}
            />
          ) : null}
        </div>
        <Pagination
          className="mt-auto"
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={(p) => list.load(p)}
          onPageSizeChange={(size) => list.load(1, size, true)}
        />
      </ListPageBody>
    </FeaturePage>
  )
}
