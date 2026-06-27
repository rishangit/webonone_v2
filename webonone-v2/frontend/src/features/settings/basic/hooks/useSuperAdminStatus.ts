import { useEffect, useState } from 'react'
import { companyApi } from '@/features/settings/basic/services/companyApi'

export function useSuperAdminStatus() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const profile = await companyApi.getSuperAdminMe()
        if (!cancelled) {
          setIsSuperAdmin(Boolean(profile))
        }
      } catch {
        if (!cancelled) {
          setIsSuperAdmin(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { isSuperAdmin, loading }
}
