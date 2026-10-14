import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, ContactValueLine, EditableSectionCard, ImagePreview } from '@webonone/ui-kit'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type StaffUserCardProps = {
  staff: CompanyStaff
  canEdit?: boolean
  canViewProfile?: boolean
  onEdit?: () => void
}

export function StaffUserCard({
  staff,
  canEdit,
  canViewProfile,
  onEdit,
}: StaffUserCardProps) {
  const { t } = useTranslation('staff')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <EditableSectionCard
      title={t('userCard.title')}
      description={t('userCard.description')}
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <ImagePreview
          key={staff.avatarUrl ?? 'empty'}
          src={staff.avatarUrl}
          alt={staff.displayName}
          mode="view"
          className="h-24 w-24 shrink-0 self-center sm:self-start"
        />
        <div className="min-w-0 w-full flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('userCard.name')}
            </p>
            <p className="text-sm text-foreground">{staff.displayName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('userCard.email')}
            </p>
            <ContactValueLine
              kind="email"
              value={staff.email}
              emptyLabel={tc('email')}
              variant="detail"
              verified={staff.email?.trim() ? staff.isEmailVerified : undefined}
              className="[&_span]:whitespace-normal [&_span]:break-all"
            />
          </div>
          {canViewProfile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/identity/users/${encodeURIComponent(staff.userId)}`)}
            >
              {t('userCard.viewProfile')}
            </Button>
          ) : null}
        </div>
      </div>
    </EditableSectionCard>
  )
}
