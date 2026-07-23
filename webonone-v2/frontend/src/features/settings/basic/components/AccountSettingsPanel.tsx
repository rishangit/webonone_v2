import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import {
  accountDescription,
  fallbackAccountLabel,
  findMatchingRole,
} from '@/features/session/utils/accountLabels'

export function AccountSettingsPanel() {
  const dispatch = useAppDispatch()
  const { activeRole, activeCompanyId, assumableRoles, loading, selectionComplete } =
    useAppSelector((s) => s.sessionRole)

  const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
  const label = matched?.label ?? fallbackAccountLabel(activeRole, activeCompanyId)
  const description = matched
    ? accountDescription(matched)
    : accountDescription({ role: activeRole ?? 'member', companyName: undefined })

  const canChange = assumableRoles.length > 1
  const changeDisabled = !selectionComplete || loading || !canChange

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Selected account</CardTitle>
          <CardDescription>The account used for this WebOnOne session.</CardDescription>
        </div>
        {canChange ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            disabled={changeDisabled}
            onClick={() => dispatch(sessionRoleActions.openChangeDialog())}
          >
            Change
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {!canChange && selectionComplete ? (
          <p className="mt-3 text-sm text-muted-foreground">Only one account is available.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
