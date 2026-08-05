import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ListPageBody,
  SearchInput,
  Pagination,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { CompanyFormDialog } from '../components/CompanyFormDialog'
import { MyCompaniesList } from '../components/MyCompaniesList'

export function AllCompaniesPage() {
  const dispatch = useAppDispatch()
  const {
    myCompanies,
    myCompaniesStatus,
    myCompaniesError,
    myCompaniesFetchedAt,
  } = useAppSelector((s) => s.companies)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const awaitingFirstLoad =
    myCompaniesFetchedAt === null && myCompanies.length === 0 && myCompaniesStatus !== 'error'

  usePlatformLoading(awaitingFirstLoad ? 'Loading companies…' : null)

  useEffect(() => {
    if (!isFresh(myCompaniesFetchedAt)) {
      dispatch(companiesActions.loadMyCompaniesRequested())
    }
  }, [dispatch, myCompaniesFetchedAt])

  const filteredItems = searchQuery.trim()
    ? myCompanies.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : myCompanies

  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  if (awaitingFirstLoad) {
    return null
  }

  return (
    <FeaturePage
      title="My Company"
      description="View and register companies you belong to on the platform."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Company name"
            onClear={() => setPage(1)}
            aria-label="Search companies"
            className="w-64"
          />
          <Button type="button" size="sm" onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add company
          </Button>
        </div>
      }
    >
      {myCompaniesError ? (
        <Alert variant="destructive">
          <AlertDescription>{myCompaniesError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? <p className="text-sm text-primary">{successMessage}</p> : null}

      <ListPageBody>
        <div className="flex-1">
          <MyCompaniesList items={visibleItems} />
        </div>
        <Pagination
          className="mt-auto"
          totalCount={filteredItems.length}
          currentPage={page}
          pageSize={pageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPage(1)
          }}
        />
      </ListPageBody>

      <p className="text-sm text-muted-foreground">
        Looking for other settings?{' '}
        <Link to="/settings/basic" className="text-primary underline-offset-4 hover:underline">
          Basic Settings
        </Link>
      </p>

      <CompanyFormDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSaved={() => {
          setSuccessMessage(
            'Registration submitted. Admin approval is required — the company stays Pending until a super admin approves or rejects it.',
          )
        }}
      />
    </FeaturePage>
  )
}
