import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  SearchInput,
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
import { CatalogFormDialog } from '@/features/catalog/components/CatalogFormDialog'
import { CatalogList } from '@/features/catalog/components/CatalogList'
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
    title: string
    addLabel: string
    select: (s: RootState) => CatalogFeatureState<CatalogItem>
    actions: typeof productsActions
    deleteAction: (id: string) => ReturnType<typeof productsActions.deleteRequested>
  }
> = {
  products: {
    title: 'Products',
    addLabel: 'Add product',
    select: (s) => s.products,
    actions: productsActions,
    deleteAction: (id) => productsActions.deleteRequested({ id }),
  },
  services: {
    title: 'Services',
    addLabel: 'Add service',
    select: (s) => s.services,
    actions: servicesActions,
    deleteAction: (id) => servicesActions.deleteRequested({ id }),
  },
  spaces: {
    title: 'Spaces',
    addLabel: 'Add space',
    select: (s) => s.spaces,
    actions: spacesActions,
    deleteAction: (id) => spacesActions.deleteRequested({ id }),
  },
}

export function CatalogListPage({ kind }: { kind: CatalogKind }) {
  const config = CONFIG[kind]
  const { goToDetail } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canCreate = user?.role === 'super_admin' || user?.role === 'company_admin'
  const canEdit = canCreate
  const canDelete = user?.role === 'super_admin'
  const [dialog, setDialog] = useState<{ id?: string } | null>(null)

  const list = useEpicCatalogList(config.select, config.actions)
  usePlatformLoading(list.loading ? `Loading ${kind}…` : null)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title={config.title}
      description={`Manage catalog ${kind}.`}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder={`Search ${kind}…`}
            className="w-64"
          />
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
          {canCreate ? (
            <Button type="button" size="sm" onClick={() => setDialog({})}>
              <Plus className="h-4 w-4" aria-hidden />
              {config.addLabel}
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
              <SelectItem value="pending">Unverified</SelectItem>
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

      {dialog !== null && (kind === 'products' || kind === 'spaces') ? (
        <CatalogFormDialog
          kind={kind}
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
