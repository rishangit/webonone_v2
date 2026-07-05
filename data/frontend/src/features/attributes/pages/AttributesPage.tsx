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
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { AttributesList } from '@/features/attributes/components/AttributesList'
import { usePaginatedList } from '@/shared/hooks/usePaginatedList'
import { dataApi } from '@/shared/services/dataApi'

export function AttributesPage() {
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canMutate = user?.role === 'super_admin'
  const loader = useCallback(
    (query: { page: number; pageSize: number; q?: string; status?: string; extra?: Record<string, string> }) =>
      dataApi.listAttributes({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status,
        value_type: query.extra?.value_type,
      }),
    [],
  )
  const list = usePaginatedList(loader)
  usePlatformLoading(list.loading ? 'Loading attributes…' : null)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title="Attributes"
      description="Manage catalog attributes."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <ListSearchField value={list.q} onChange={list.setQ} placeholder="Search attributes…" />
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
          {canMutate ? (
            <Button asChild>
              <Link to="/attributes/new">Add new</Link>
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
          list.setExtraFilters({})
          void list.load(1)
        }}
      >
        <FormField label="Status" htmlFor="attributes-status">
          <Select value={list.status} onValueChange={list.setStatus}>
            <SelectTrigger id="attributes-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Value type" htmlFor="attributes-value-type">
          <Select
            value={list.extraFilters.value_type ?? 'all'}
            onValueChange={(v) =>
              list.setExtraFilters(v === 'all' ? {} : { value_type: v })
            }
          >
            <SelectTrigger id="attributes-value-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="text">Text</SelectItem>
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
            <AttributesList
              items={list.items}
              onDeleted={() => void list.load(list.page)}
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
