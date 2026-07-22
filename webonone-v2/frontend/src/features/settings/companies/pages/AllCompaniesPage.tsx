import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ListPageBody,
  ListSearchField,
  Pagination,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { RegisterCompanyDialog } from '@/features/settings/basic/components/RegisterCompanyDialog'
import type { RegisterCompanyFormValues } from '@/features/settings/basic/schemas/companySchemas'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { MyCompaniesList } from '../components/MyCompaniesList'

export function AllCompaniesPage() {
  const dispatch = useAppDispatch()
  const {
    myCompanies,
    myCompaniesStatus,
    myCompaniesError,
    myCompaniesFetchedAt,
    myCompanyStatus,
    myCompanyError,
  } = useAppSelector((s) => s.companies)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [pendingRegister, setPendingRegister] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loading = myCompaniesStatus === 'loading'
  const awaitingFirstLoad = myCompaniesFetchedAt === null && myCompaniesStatus !== 'error'

  usePlatformLoading(awaitingFirstLoad || loading ? 'Loading companies…' : null)

  useEffect(() => {
    if (!isFresh(myCompaniesFetchedAt)) {
      dispatch(companiesActions.loadMyCompaniesRequested())
    }
  }, [dispatch, myCompaniesFetchedAt])

  useEffect(() => {
    if (!pendingRegister) return

    if (myCompanyStatus === 'idle') {
      setRegisterOpen(false)
      setSuccessMessage(
        'Registration submitted. Admin approval is required — the company stays Pending until a super admin approves or rejects it.',
      )
      setPendingRegister(false)
    } else if (myCompanyStatus === 'error') {
      setPendingRegister(false)
    }
  }, [myCompanyStatus, pendingRegister])

  const filteredItems = searchQuery.trim()
    ? myCompanies.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : myCompanies

  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)
  const isSubmitting = myCompanyStatus === 'saving' && pendingRegister
  const submitError = myCompanyStatus === 'error' && pendingRegister ? myCompanyError : null

  function handleRegister(values: RegisterCompanyFormValues) {
    setSuccessMessage(null)
    setPendingRegister(true)
    dispatch(companiesActions.registerCompanyRequested(values))
  }

  if (awaitingFirstLoad) {
    return null
  }

  return (
    <FeaturePage
      title="My Companies"
      description="View and register companies you belong to on the platform."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add company
          </Button>
          <ListSearchField
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value)
              setPage(1)
            }}
            placeholder="Company name"
            onClear={() => setPage(1)}
            aria-label="Search companies"
          />
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
          {!loading ? <MyCompaniesList items={visibleItems} /> : null}
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

      <RegisterCompanyDialog
        open={registerOpen}
        isSubmitting={isSubmitting}
        error={submitError}
        onOpenChange={setRegisterOpen}
        onSubmit={handleRegister}
      />
    </FeaturePage>
  )
}
