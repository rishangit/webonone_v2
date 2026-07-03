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
  LoadingState,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { PlatformHandoffSpinner, usePlatformHandoffPending } from '@/features/auth/components/PlatformHandoffSpinner'
import { UnitsList } from '@/features/units/components/UnitsList'
import { usePaginatedList } from '@/shared/hooks/usePaginatedList'
import { dataApi } from '@/shared/services/dataApi'

export function UnitsPage() {
  const handoffPending = usePlatformHandoffPending()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canMutate = user?.role === 'super_admin'
  const loader = useCallback(
    (query: { page: number; pageSize: number; q?: string; status?: string }) =>
      dataApi.listUnits({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status,
      }),
    [],
  )
  const list = usePaginatedList(loader)

  if (handoffPending) return <PlatformHandoffSpinner />
  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title="Units"
      description="Manage units of measure."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <ListSearchField value={list.q} onChange={list.setQ} placeholder="Search units…" />
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
          {canMutate ? (
            <Button asChild>
              <Link to="/units/new">Add new</Link>
            </Button>
          ) : null}
        </div>
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
        <FormField label="Status" htmlFor="units-status">
          <Select value={list.status} onValueChange={list.setStatus}>
            <SelectTrigger id="units-status">
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
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {list.loading ? (
            <LoadingState overlay label="Loading units…" />
          ) : (
            <UnitsList items={list.items} onDeleted={() => void list.load(list.page)} canMutate={canMutate} />
          )}
        </div>
        <Pagination
          className="mt-auto"
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          pageSizeOptions={[12, 24, 48]}
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
