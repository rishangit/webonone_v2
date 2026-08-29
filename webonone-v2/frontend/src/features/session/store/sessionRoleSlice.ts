import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authActions } from '@/features/auth/store/authSlice'
import type {
  AssumableRoleOption,
  AssumableRolesResponse,
  SessionRole,
} from '../types/sessionRole.types'
import type { DataEntityKey } from '@webonone/platform-nav'
import {
  clearSessionRoleStorage,
  readSessionRoleStorage,
  writeSessionRoleStorage,
} from '../utils/sessionRoleStorage'

export type { SessionRole } from '../types/sessionRole.types'

export type SessionRoleDialogMode = 'gate' | 'settings'

interface SessionRoleState {
  activeRole: SessionRole | null
  activeCompanyId: string | null
  selectionComplete: boolean
  assumableRoles: AssumableRoleOption[]
  dialogOpen: boolean
  dialogMode: SessionRoleDialogMode
  loading: boolean
}

const emptyState: SessionRoleState = {
  activeRole: null,
  activeCompanyId: null,
  selectionComplete: false,
  assumableRoles: [],
  dialogOpen: false,
  dialogMode: 'gate',
  loading: false,
}

function loadInitialState(): SessionRoleState {
  const stored = readSessionRoleStorage()
  if (!stored) {
    return { ...emptyState }
  }

  return {
    ...emptyState,
    activeRole: stored.activeRole,
    activeCompanyId: stored.activeCompanyId,
    selectionComplete: true,
  }
}

function persistSelection(
  role: SessionRole,
  companyId: string | null,
  userId?: string,
): void {
  const existing = readSessionRoleStorage()
  writeSessionRoleStorage({
    selectionComplete: true,
    activeRole: role,
    activeCompanyId: companyId,
    userId: userId ?? existing?.userId,
  })
}

function applyRole(
  state: SessionRoleState,
  role: SessionRole,
  companyId: string | null,
  userId?: string,
): void {
  state.activeRole = role
  state.activeCompanyId = companyId
  state.selectionComplete = true
  state.dialogOpen = false
  state.dialogMode = 'gate'
  state.loading = false
  persistSelection(role, companyId, userId)
}

function restoreSelectionFromStorage(userId: string): SessionRoleState | null {
  const stored = readSessionRoleStorage()
  if (!stored?.selectionComplete) {
    return null
  }
  if (stored.userId && stored.userId !== userId) {
    return null
  }

  return {
    ...emptyState,
    activeRole: stored.activeRole,
    activeCompanyId: stored.activeCompanyId,
    selectionComplete: true,
  }
}

function clearSelectionState(): SessionRoleState {
  clearSessionRoleStorage()
  return { ...emptyState }
}

export const sessionRoleSlice = createSlice({
  name: 'sessionRole',
  initialState: loadInitialState(),
  reducers: {
    bootstrapRequested(state) {
      state.loading = true
    },
    rolesLoaded(state, action: PayloadAction<AssumableRolesResponse>) {
      const { roles, requiresAccountSelection } = action.payload
      state.loading = false
      state.assumableRoles = roles

      // Sticky selection already restored — refresh labels only; never re-open gate.
      if (state.selectionComplete) {
        return
      }

      if (!requiresAccountSelection) {
        const only = roles[0]
        if (only) {
          applyRole(state, only.role, only.companyId)
        }
        return
      }

      state.dialogOpen = true
      state.dialogMode = 'gate'
    },
    roleSelected(
      state,
      action: PayloadAction<{ role: SessionRole; companyId: string | null; userId?: string }>,
    ) {
      applyRole(state, action.payload.role, action.payload.companyId, action.payload.userId)
    },
    restoredFromStorage(
      state,
      action: PayloadAction<{ role: SessionRole; companyId: string | null }>,
    ) {
      state.activeRole = action.payload.role
      state.activeCompanyId = action.payload.companyId
      state.selectionComplete = true
      state.dialogOpen = false
      state.dialogMode = 'gate'
      state.loading = false
    },
    companyDataEntitiesUpdated(
      state,
      action: PayloadAction<{ companyId: string; dataEntities: DataEntityKey[] }>,
    ) {
      state.assumableRoles = state.assumableRoles.map((role) =>
        role.companyId === action.payload.companyId
          ? { ...role, dataEntities: action.payload.dataEntities }
          : role,
      )
    },
    openChangeDialog(state) {
      if (!state.selectionComplete) {
        return
      }
      state.dialogOpen = true
      state.dialogMode = 'settings'
    },
    closeDialog(state) {
      state.dialogOpen = false
      state.dialogMode = 'gate'
    },
    reset() {
      return clearSelectionState()
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authActions.loginSuccess, (_state, action) => {
      const restored = restoreSelectionFromStorage(action.payload.user.id)
      if (restored) {
        return restored
      }
      return clearSelectionState()
    })
    builder.addCase(authActions.logout, () => clearSelectionState())
  },
})

export const sessionRoleReducer = sessionRoleSlice.reducer
export const sessionRoleActions = sessionRoleSlice.actions
