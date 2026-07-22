import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map } from 'rxjs/operators'
import { sessionRoleApi } from '../services/sessionRoleApi'
import { sessionRoleActions } from './sessionRoleSlice'
import type { AssumableRolesResponse } from '../types/sessionRole.types'

type SessionRoleEpic = Epic

const defaultRolesPayload: AssumableRolesResponse = {
  roles: [{ role: 'member', companyId: null, label: 'Default User' }],
  requiresAccountSelection: false,
  hasCompanyMembership: false,
}

const sessionRoleBootstrapEpic: SessionRoleEpic = (action$) =>
  action$.pipe(
    ofType(sessionRoleActions.bootstrapRequested.type),
    exhaustMap(() =>
      from(sessionRoleApi.getAssumableRoles()).pipe(
        map((result) => sessionRoleActions.rolesLoaded(result)),
        catchError(() => of(sessionRoleActions.rolesLoaded(defaultRolesPayload))),
      ),
    ),
  )

export const sessionRoleEpics = combineEpics(sessionRoleBootstrapEpic)
