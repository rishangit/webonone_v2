import { useCallback } from 'react'
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
  Spinner,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { PlatformHandoffSpinner, usePlatformHandoffPending } from '@/features/auth/components/PlatformHandoffSpinner'
import { CatalogList } from '@/features/catalog/components/CatalogList'
import { usePaginatedList } from '@/shared/hooks/usePaginatedList'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem, PaginatedResult } from '@/shared/types/data.types'

type CatalogKind = 'products' | 'services' | 'spaces'

const CONFIG: Record<
  CatalogKind,
  { title: string; singular: string; list: (q: Record<string, unknown>) => Promise<PaginatedResult<CatalogItem>>; delete: (id: string) => Promise<void> }
> = {
  products: { title: 'Products', singular: 'product', list: (q) => dataApi.listProducts(q), delete: (id) => dataApi.deleteProduct(id) },
  services: { title: 'Services', singular: 'service', list: (q) => dataApi.listServices(q), delete: (id) => dataApi.deleteService(id) },
  spaces: { title: 'Spaces', singular: 'space', list: (q) => dataApi.listSpaces(q), delete: (id) => dataApi.deleteSpace(id) },
}

export function CatalogListPage({ kind }: { kind: CatalogKind }) {
  const config = CONFIG[kind]
  const handoffPending = usePlatformHandoffPending()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canMutate = user?.role === 'super_admin'
  const loader = useCallback(
    (query: { page: number; pageSize: number; q?: string; status?: string }) =>
      config.list({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status,
      }),
    [config],
  )
  const list = usePaginatedList(loader)

  if (handoffPending) return <PlatformHandoffSpinner />
  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title={config.title}
      description={`Manage catalog ${kind}.`}
      actions={
        <>
          {canMutate ? (
            <Button asChild>
              <Link to={`/${kind}/new`}>Create {config.singular}</Link>
            </Button>
          ) : null}
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
        </>
      }
    >
      <ListFilterPanel
        open={list.filterOpen}
        onOpenChange={list.setFilterOpen}
        onApply={() => void list.load(1)}
        onClear={() => {
          list.setStatus('all')
          void list.load(1)
        }}
      >
        <FormField label="Status" htmlFor={`${kind}-status`}>
          <Select value={list.status} onValueChange={list.setStatus}>
            <SelectTrigger id={`${kind}-status`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>
      <ListSearchField value={list.q} onChange={list.setQ} placeholder={`Search ${kind}…`} />
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <CatalogList
            basePath={`/${kind}`}
            items={list.items}
            onDelete={async (itemId) => {
              await config.delete(itemId)
              await list.load(list.page)
            }}
            canMutate={canMutate}
          />
        )}
        <Pagination
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          onPageChange={(p) => void list.load(p)}
          onPageSizeChange={(size) => {
            list.setPageSize(size)
            void list.load(1, size)
          }}
        />
      </ListPageBody>
    </FeaturePage>
  )
}
