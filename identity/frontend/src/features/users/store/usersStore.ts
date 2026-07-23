import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { listCompanyCustomers, listUsers } from '@/features/users/services/usersApi'
import type { UserPickerRole, UserPickerUser } from '@/features/users/types'

export const usersStore = createPaginatedFeatureStore<UserPickerUser>({
  name: 'users',
  list: (q) => {
    const companyId = q.extra?.companyId as string | undefined
    if (companyId) {
      return listCompanyCustomers({
        companyId,
        page: q.page,
        pageSize: q.pageSize,
        search: q.extra?.search ?? '',
      })
    }
    return listUsers({
      page: q.page,
      pageSize: q.pageSize,
      search: q.extra?.search ?? '',
      role: (q.extra?.role as UserPickerRole | undefined) ?? null,
    })
  },
})

export const usersReducer = usersStore.reducer
export const usersActions = usersStore.actions
export const usersEpics = usersStore.epics
