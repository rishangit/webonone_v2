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
        <>
          {canMutate ? (
            <Button asChild>
              <Link to="/units/new">Create unit</Link>
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
      <ListSearchField value={list.q} onChange={list.setQ} placeholder="Search units…" />
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
          <UnitsList items={list.items} onDeleted={() => void list.load(list.page)} canMutate={canMutate} />
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
