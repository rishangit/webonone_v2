import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
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
import { TemplateFormDialog } from '@/features/sms/components/TemplateFormDialog'
import {
  formatTemplateDateTime,
  formatTemplateScope,
  truncateTemplateBody,
} from '@/features/sms/utils/formatTemplateMeta'
import {
  templateDetailPath,
  templatePreviewPath,
  templateVersionsPath,
} from '@/features/sms/utils/templatePaths'
import { useSession } from '@/features/auth/SessionContext'
import { smsAdminApi, type SmsAdminTemplate } from '@/shared/services/smsAdminApi'

export function TemplateDetailScreen({ templateId }: { templateId: string }) {
  const { t } = useTranslation('smsTemplates')
  const router = useRouter()
  const { user } = useSession()
  const { toast } = useToast()
  const canEdit = user?.role === 'super_admin' || user?.role === 'company_admin'

  const [template, setTemplate] = useState<SmsAdminTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTemplate(await smsAdminApi.getTemplate(templateId))
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
      description="SMS template details."
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
        description="Message body and placeholders."
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
        <ReadOnlyField label="Message body" value={truncateTemplateBody(template.body, 280)} />
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

