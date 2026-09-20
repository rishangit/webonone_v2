import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  EditableSectionCard,
  FeatureScreen,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { TemplateFormDialog } from '@/features/email/components/TemplateFormDialog'
import {
  formatTemplateDateTime,
  formatTemplateScope,
  truncateTemplateBody,
} from '@/features/email/utils/formatTemplateMeta'
import {
  templateDetailPath,
  templatePreviewPath,
  templateVersionsPath,
} from '@/features/email/utils/templatePaths'
import { useSession } from '@/features/auth/SessionContext'
import { emailAdminApi, type EmailAdminTemplate } from '@/shared/services/emailAdminApi'

export function TemplateDetailScreen({ templateId }: { templateId: string }) {
  const { t } = useTranslation('emailTemplates')
  const router = useRouter()
  const { user } = useSession()
  const { toast } = useToast()
  const canEdit = user?.role === 'super_admin' || user?.role === 'company_admin'

  const [template, setTemplate] = useState<EmailAdminTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTemplate(await emailAdminApi.getTemplate(templateId))
    } catch (err) {
      setTemplate(null)
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Spinner label="Loading template…" />
      </FeatureScreen>
    )
  }

  if (!template) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? 'Template not found.'}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={template.name}
      description="Email template details."
      onBack={() => router.back()}
      actions={
        <Button
          size="sm"
          variant="outline"
          onPress={() => router.push(templatePreviewPath(template.id) as Href)}
        >
          Preview
        </Button>
      }
    >
      {error ? <Body className="text-destructive">{error}</Body> : null}

      <EditableSectionCard
        title={t('singular')}
        description="Subject, bodies, and placeholders."
        canEdit={canEdit}
        onEdit={() => setEditOpen(true)}
      >
        <View className="flex-row flex-wrap items-center gap-2">
          <Subheading>{template.name}</Subheading>
          <StatusTag variant={template.isActive ? 'approved' : 'rejected'}>
            {template.isActive ? 'Active' : 'Inactive'}
          </StatusTag>
          {template.isDefault ? <StatusTag variant="pending">Default</StatusTag> : null}
        </View>
        <ReadOnlyField label="Subject" value={template.subject} />
        <ReadOnlyField label="HTML body" value={truncateTemplateBody(template.htmlBody)} />
        <ReadOnlyField label="Plain text body" value={truncateTemplateBody(template.textBody)} />
        <ReadOnlyField
          label="Required placeholders"
          value={
            template.requiredKeys.length === 0
              ? 'None'
              : template.requiredKeys.map((key) => `{{${key}}}`).join(', ')
          }
        />
      </EditableSectionCard>

      <Card className="gap-4">
        <Subheading>Metadata</Subheading>
        <Muted>Slug, scope, and timestamps.</Muted>
        <ReadOnlyField label="Slug" value={template.slug} />
        <ReadOnlyField label="Scope" value={formatTemplateScope(template)} />
        <ReadOnlyField label="Updated" value={formatTemplateDateTime(template.updatedAt)} />
        {template.createdAt ? (
          <ReadOnlyField label="Created" value={formatTemplateDateTime(template.createdAt)} />
        ) : null}
      </Card>

      {!template.isDefault ? (
        <Card className="gap-3">
          <Subheading>Version history</Subheading>
          <Muted>Restore a previous saved version of this template.</Muted>
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(templateVersionsPath(template.id) as Href)}
          >
            Version history
          </Button>
        </Card>
      ) : null}

      {canEdit ? (
        <TemplateFormDialog
          open={editOpen}
          mode="edit"
          template={template}
          onOpenChange={setEditOpen}
          onSaved={(saved) => {
            setTemplate(saved)
            toast({ title: 'Template saved' })
            if (saved.id !== templateId) {
              router.replace(templateDetailPath(saved.id) as Href)
            }
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
