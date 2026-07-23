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
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { UnitFormDialog } from '@/features/units/components/UnitFormDialog'
import { UnitsList } from '@/features/units/components/UnitsList'
import { unitsActions } from '@/features/units/store'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

export function UnitsPage() {
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canCreate = user?.role === 'super_admin' || user?.role === 'company_admin'
  const canMutate = user?.role === 'super_admin'
  const [dialog, setDialog] = useState<{ id?: string } | null>(null)

  const list = useEpicCatalogList((s) => s.units, unitsActions)
  usePlatformLoading(list.loading ? 'Loading units…' : null)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title="Units"
      description="Manage units of measure."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder="Search units…"
            className="w-64"
          />
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
          {canCreate ? (
            <Button type="button" size="sm" onClick={() => setDialog({})}>
              <Plus className="h-4 w-4" aria-hidden />
              Add unit
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
        <FormField label="Status" htmlFor="units-status">
          <Select value={list.status} onValueChange={list.setStatus}>
            <SelectTrigger id="units-status">
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
            <UnitsList
              items={list.items}
              onEdit={(id) => setDialog({ id })}
              onDeleted={(id) => {
                dispatch(unitsActions.deleteRequested({ id }))
                list.load(list.page, list.pageSize, true)
              }}
              onVerify={(id) => {
                dispatch(unitsActions.saveDetailRequested({ id, body: { status: 'verified' } }))
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

      {dialog !== null ? (
        <UnitFormDialog
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
