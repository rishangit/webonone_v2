import { apiClient } from '@/shared/services/apiClient'
import type { AssumableRolesResponse } from '../types/sessionRole.types'

export const sessionRoleApi = {
  getAssumableRoles(): Promise<AssumableRolesResponse> {
    return apiClient<AssumableRolesResponse>('/company/me/assumable-roles')
  },
}
