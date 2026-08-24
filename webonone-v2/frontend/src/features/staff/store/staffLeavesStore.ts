import { createCatalogFeatureStore, type CatalogListQuery } from '@webonone/store-kit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap } from 'rxjs/operators'
import { staffLeaveApi } from '@/features/staff/services/staffLeaveApi'
import type {
  CompanyStaffLeave,
  CreateCompanyStaffLeaveBody,
} from '@/features/staff/types/staffLeave.types'

const staffLeavesStore = createCatalogFeatureStore<CompanyStaffLeave>({
  name: 'staffLeaves',
  list: async (query) => {
    const staffId =
      query.extra?.staffId ?? (query as CatalogListQuery & { staffId?: string }).staffId
    if (!staffId) {
      return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 12 }
    }
    return staffLeaveApi.list(staffId, query)
  },
  get: async (id) => {
    throw new Error(`Staff leave detail is not supported (${id})`)
  },
  create: (body) => {
    const { staffId, ...payload } = body as { staffId: string } & CreateCompanyStaffLeaveBody
    return staffLeaveApi.create(staffId, payload)
  },
  update: async (id) => {
    throw new Error(`Staff leave update is not supported (${id})`)
  },
  delete: async () => {
    /* Use deleteLeaveRequested epic — requires staffId. */
  },
})

const approveRequested = { type: 'staffLeaves/approveRequested' as const }
const rejectRequested = { type: 'staffLeaves/rejectRequested' as const }
const deleteLeaveRequested = { type: 'staffLeaves/deleteLeaveRequested' as const }

type ApproveRequested = {
  type: typeof approveRequested.type
  payload: { staffId: string; leaveId: string }
}

type RejectRequested = {
  type: typeof rejectRequested.type
  payload: { staffId: string; leaveId: string }
}

type DeleteLeaveRequested = {
  type: typeof deleteLeaveRequested.type
  payload: { staffId: string; leaveId: string }
}

function approveLeaveRequested(staffId: string, leaveId: string): ApproveRequested {
  return { type: approveRequested.type, payload: { staffId, leaveId } }
}

function rejectLeaveRequested(staffId: string, leaveId: string): RejectRequested {
  return { type: rejectRequested.type, payload: { staffId, leaveId } }
}

function deleteLeaveRequestedAction(staffId: string, leaveId: string): DeleteLeaveRequested {
  return { type: deleteLeaveRequested.type, payload: { staffId, leaveId } }
}

const approveEpic: Epic = (action$) =>
  action$.pipe(
    ofType(approveRequested.type),
    exhaustMap((action: ApproveRequested) =>
      from(staffLeaveApi.approve(action.payload.staffId, action.payload.leaveId)).pipe(
        mergeMap(() =>
          of(
            staffLeavesStore.actions.loadListRequested({
              page: 1,
              force: true,
              extra: { staffId: action.payload.staffId },
            }),
          ),
        ),
        catchError((err: unknown) =>
          of(
            staffLeavesStore.actions.loadListFailed(
              err instanceof Error ? err.message : 'Failed to approve leave',
            ),
          ),
        ),
      ),
    ),
  )

const rejectEpic: Epic = (action$) =>
  action$.pipe(
    ofType(rejectRequested.type),
    exhaustMap((action: RejectRequested) =>
      from(staffLeaveApi.reject(action.payload.staffId, action.payload.leaveId)).pipe(
        mergeMap(() =>
          of(
            staffLeavesStore.actions.loadListRequested({
              page: 1,
              force: true,
              extra: { staffId: action.payload.staffId },
            }),
          ),
        ),
        catchError((err: unknown) =>
          of(
            staffLeavesStore.actions.loadListFailed(
              err instanceof Error ? err.message : 'Failed to reject leave',
            ),
          ),
        ),
      ),
    ),
  )

const deleteLeaveEpic: Epic = (action$) =>
  action$.pipe(
    ofType(deleteLeaveRequested.type),
    exhaustMap((action: DeleteLeaveRequested) =>
      from(staffLeaveApi.delete(action.payload.staffId, action.payload.leaveId)).pipe(
        mergeMap(() =>
          of(
            staffLeavesStore.actions.deleteSucceeded(action.payload.leaveId),
            staffLeavesStore.actions.loadListRequested({
              page: 1,
              force: true,
              extra: { staffId: action.payload.staffId },
            }),
          ),
        ),
        catchError((err: unknown) =>
          of(
            staffLeavesStore.actions.loadListFailed(
              err instanceof Error ? err.message : 'Failed to cancel leave',
            ),
          ),
        ),
      ),
    ),
  )

export const staffLeavesReducer = staffLeavesStore.reducer
export const staffLeavesActions = {
  ...staffLeavesStore.actions,
  approveLeaveRequested,
  rejectLeaveRequested,
  deleteLeaveRequested: deleteLeaveRequestedAction,
}
export const staffLeavesEpics = combineEpics(
  staffLeavesStore.epics,
  approveEpic,
  rejectEpic,
  deleteLeaveEpic,
)
