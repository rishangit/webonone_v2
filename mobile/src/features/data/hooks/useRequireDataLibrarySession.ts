import { useEffect } from 'react'
import { useRouter, type Href } from 'expo-router'
import { useDataCatalogScope } from '@/features/data/hooks/useDataCatalogScope'

/** Redirect company sessions away from Data library reference screens (tags, units, attributes). */
export function useRequireDataLibrarySession(): boolean {
  const router = useRouter()
  const { isDataLibrarySession } = useDataCatalogScope()

  useEffect(() => {
    if (!isDataLibrarySession) {
      router.replace('/(app)/' as Href)
    }
  }, [isDataLibrarySession, router])

  return isDataLibrarySession
}
