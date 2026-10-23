import { useState } from 'react'
import { Card, EditableSectionCard } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { ThemeBasicSettingsTabProps } from './types'
import { ThemeBasicSettingsBody } from './ThemeBasicSettingsBody'
import { ThemeBasicSettingsDialog } from './ThemeBasicSettingsDialog'

export function ThemeBasicSettingsTab({
  theme,
  onPersist,
  fieldErrors = {},
  canManage = false,
  saving = false,
}: ThemeBasicSettingsTabProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [dialogOpen, setDialogOpen] = useState(false)

  const viewBody = (
    <ThemeBasicSettingsBody theme={theme} onChange={() => undefined} fieldErrors={fieldErrors} mode="view" />
  )

  if (!canManage) {
    return <Card className="space-y-4 p-4">{viewBody}</Card>
  }

  return (
    <>
      <EditableSectionCard
        title={t('basicSettings')}
        description={t('themeBasicSettingsCardDescription')}
        canEdit
        onEdit={() => setDialogOpen(true)}
        editAriaLabel={tc('edit')}
      >
        {viewBody}
      </EditableSectionCard>
      <ThemeBasicSettingsDialog
        open={dialogOpen}
        theme={theme}
        saving={saving}
        onOpenChange={setDialogOpen}
        onSubmit={onPersist}
      />
    </>
  )
}
