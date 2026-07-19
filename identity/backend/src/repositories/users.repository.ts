import type { Knex } from 'knex'
import { db } from '../models/user.repository.js'

export type IdentityUserRole = 'super_admin' | 'company_admin' | 'member'

export type IdentityUserListItemRow = {
  id: string
  display_name: string
  email: string
  avatar_url: string | null
}

type UserRoleRow = {
  user_id: string
  role: IdentityUserRole
  created_at: Date
  id: string
}

export type FindIdentityUsersParams = {
  search: string
  role: IdentityUserRole | null
  page: number
  pageSize: number
}

export type FindIdentityUsersResult = {
  items: Array<IdentityUserListItemRow & { role?: IdentityUserRole }>
  total: number
}

function applySearchFilter(
  query: Knex.QueryBuilder,
  search: string,
): Knex.QueryBuilder {
  if (!search) {
    return query
  }

  const pattern = `%${search}%`
  return query.where((builder) => {
    builder.where('u.display_name', 'like', pattern).orWhere('u.email', 'like', pattern)
  })
}

function applyRoleFilter(
  query: Knex.QueryBuilder,
  role: IdentityUserRole | null,
): Knex.QueryBuilder {
  if (!role) {
    return query
  }

  return query.whereExists(
    db('users_roles as ur')
      .select(db.raw('1'))
      .whereRaw('ur.user_id = u.id')
      .andWhere('ur.role', role),
  )
}

function getRolePriority(role: IdentityUserRole): number {
  switch (role) {
    case 'super_admin':
      return 0
    case 'company_admin':
      return 1
    case 'member':
      return 2
    default:
      return 9
  }
}

function chooseRepresentativeRole(rows: UserRoleRow[]): IdentityUserRole | undefined {
  if (rows.length === 0) {
    return undefined
  }

  const sorted = [...rows].sort((a, b) => {
    const rolePriorityDiff = getRolePriority(a.role) - getRolePriority(b.role)
    if (rolePriorityDiff !== 0) {
      return rolePriorityDiff
    }

    const createdAtDiff = a.created_at.getTime() - b.created_at.getTime()
    if (createdAtDiff !== 0) {
      return createdAtDiff
    }

    return a.id.localeCompare(b.id)
  })

  return sorted[0]?.role
}

export async function findIdentityUsers(params: FindIdentityUsersParams): Promise<FindIdentityUsersResult> {
  const offset = (params.page - 1) * params.pageSize

  const baseUsersQuery = applyRoleFilter(
    applySearchFilter(db('users as u').select('u.id'), params.search),
    params.role,
  )

  const totalRow = await db
    .from(baseUsersQuery.clone().as('filtered_users'))
    .count<{ total: number | string }>({ total: '*' })
    .first()

  const total = Number(totalRow?.total ?? 0)

  const pageRows = (await db
    .from(baseUsersQuery.clone().as('filtered_users'))
    .join('users as u', 'u.id', 'filtered_users.id')
    .select<IdentityUserListItemRow[]>(
      'u.id',
      'u.display_name',
      'u.email',
      'u.avatar_url',
    )
    .orderBy('u.display_name', 'asc')
    .orderBy('u.id', 'asc')
    .limit(params.pageSize)
    .offset(offset)) as IdentityUserListItemRow[]

  if (pageRows.length === 0) {
    return { items: [], total }
  }

  if (params.role) {
    const filteredRole = params.role
    return {
      items: pageRows.map((row) => ({ ...row, role: filteredRole })),
      total,
    }
  }

  const userIds = pageRows.map((row) => row.id)
  const roleRows = await db<UserRoleRow>('users_roles as ur')
    .select('ur.user_id', 'ur.role', 'ur.created_at', 'ur.id')
    .whereIn('ur.user_id', userIds)

  const rolesByUserId = new Map<string, UserRoleRow[]>()
  for (const roleRow of roleRows) {
    const existing = rolesByUserId.get(roleRow.user_id) ?? []
    existing.push(roleRow)
    rolesByUserId.set(roleRow.user_id, existing)
  }

  const items = pageRows.map((row) => ({
    ...row,
    role: chooseRepresentativeRole(rolesByUserId.get(row.id) ?? []),
  }))

  return {
    items,
    total,
  }
}
