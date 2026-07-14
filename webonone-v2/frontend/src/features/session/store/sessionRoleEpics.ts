import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map } from 'rxjs/operators'
import { sessionRoleApi } from '../services/sessionRoleApi'
import { sessionRoleActions } from './sessionRoleSlice'

type SessionRoleEpic = Epic

const defaultRolesPayload = {
  roles: [{ role: 'member' as const, companyId: null, label: 'Default User' }],
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
