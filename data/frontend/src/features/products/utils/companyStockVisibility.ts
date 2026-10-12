import type { DataRole } from '@/features/auth/types/auth.types'

/** Company-scoped stock (batches, quantities, sell from active batch) is hidden for platform library super admins. */
export function shouldShowCompanyStock(role: DataRole | undefined | null): boolean {
  return role !== 'super_admin'
}
