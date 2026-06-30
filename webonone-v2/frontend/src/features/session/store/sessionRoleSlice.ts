import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AssumableRoleOption, SessionRole } from '../types/sessionRole.types'

export type { SessionRole } from '../types/sessionRole.types'

interface SessionRoleState {
  activeRole: SessionRole | null
  activeCompanyId: string | null
  selectionComplete: boolean
  assumableRoles: AssumableRoleOption[]
  dialogOpen: boolean
  loading: boolean
}

const initialState: SessionRoleState = {
  activeRole: null,
  activeCompanyId: null,
  selectionComplete: false,
  assumableRoles: [],
  dialogOpen: false,
  loading: false,
}

function applyRole(
  state: SessionRoleState,
  role: SessionRole,
  companyId: string | null,
): void {
  state.activeRole = role
  state.activeCompanyId = companyId
  state.selectionComplete = true
  state.dialogOpen = false
  state.loading = false
}

export const sessionRoleSlice = createSlice({
  name: 'sessionRole',
  initialState,
  reducers: {
    bootstrapStarted(state) {
      state.loading = true
    },
    rolesLoaded(
      state,
      action: PayloadAction<{ roles: AssumableRoleOption[]; hasCompanyMembership: boolean }>,
    ) {
      const { roles, hasCompanyMembership } = action.payload
      state.loading = false
      state.assumableRoles = roles

      if (!hasCompanyMembership || roles.length === 1) {
        const only = roles[0]
        if (only) {
          applyRole(state, only.role, only.companyId)
        }
        return
      }

      state.dialogOpen = true
    },
    roleSelected(
      state,
      action: PayloadAction<{ role: SessionRole; companyId: string | null }>,
    ) {
      applyRole(state, action.payload.role, action.payload.companyId)
    },
    reset() {
      return initialState
    },
  },
})

export const sessionRoleReducer = sessionRoleSlice.reducer
export const sessionRoleActions = sessionRoleSlice.actions
