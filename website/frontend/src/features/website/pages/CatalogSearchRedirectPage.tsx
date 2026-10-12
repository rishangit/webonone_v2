import { Navigate, useSearchParams } from 'react-router-dom'

/** Legacy `/search` URLs → home with the same query string. */
export function CatalogSearchRedirectPage() {
  const [searchParams] = useSearchParams()
  const search = searchParams.toString()
  return <Navigate to={search ? `/?${search}` : '/'} replace />
}
