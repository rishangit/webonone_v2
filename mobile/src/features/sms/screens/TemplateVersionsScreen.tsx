import { useCallback, useEffect, useState } from 'react'

import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {

  Body,

  Button,

  FeatureScreen,

  ItemList,

  ItemListContent,

  ItemListEmpty,

  ItemListItem,

  ItemListMenu,

  ItemListMenuItem,

  Spinner,

  useToast,

} from '@webonone/mobile-ui'

import {
  formatTemplateDateTime,
  truncateTemplateBody,
} from '@/features/sms/utils/formatTemplateMeta'

import { templateDetailPath } from '@/features/sms/utils/templatePaths'

import {

  smsAdminApi,

  type SmsAdminTemplate,

  type SmsTemplateVersion,

} from '@/shared/services/smsAdminApi'



export function TemplateVersionsScreen({ templateId }: { templateId: string }) {
  const { t } = useTranslation('smsTemplates')

  const router = useRouter()

  const { toast } = useToast()



  const [template, setTemplate] = useState<SmsAdminTemplate | null>(null)

  const [versions, setVersions] = useState<SmsTemplateVersion[]>([])

  const [loading, setLoading] = useState(true)

  const [restoringId, setRestoringId] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)



  const load = useCallback(async () => {

    setLoading(true)

    setError(null)

    try {

      const [detail, items] = await Promise.all([

        smsAdminApi.getTemplate(templateId),

        smsAdminApi.listTemplateVersions(templateId),

      ])

      setTemplate(detail)

      setVersions(items)

    } catch (err) {

      setTemplate(null)

      setVersions([])

      setError(err instanceof Error ? err.message : 'Failed to load versions')

    } finally {

      setLoading(false)

    }

  }, [templateId])



  useEffect(() => {

    void load()

  }, [load])



  async function handleRestore(versionId: string) {

    setRestoringId(versionId)

    try {

      const restored = await smsAdminApi.restoreTemplateVersion(templateId, versionId)

      toast({ title: 'Version restored' })

      if (restored.id !== templateId) {

        router.replace(templateDetailPath(restored.id) as Href)

      } else {

        await load()

      }

    } catch (err) {

      toast({

        title: 'Restore failed',

        description: err instanceof Error ? err.message : undefined,

        variant: 'destructive',

      })

    } finally {

      setRestoringId(null)

    }

  }



  if (loading) {

    return (

      <FeatureScreen title={t('versions.pageTitleFallback')} onBack={() => router.back()}>

        <Spinner label="Loading versions…" />

      </FeatureScreen>

    )

  }



  return (

    <FeatureScreen

      title={template ? `Versions — ${template.name}` : 'Version history'}

      description="Restore a previous saved version."

      onBack={() => router.back()}

      actions={

        <Button size="sm" variant="outline" onPress={() => void load()}>

          Refresh

        </Button>

      }

    >

      {error ? <Body className="text-destructive">{error}</Body> : null}

      {versions.length === 0 ? <ItemListEmpty>No versions saved yet.</ItemListEmpty> : null}

      <ItemList>

        {versions.map((version) => (

          <ItemListItem key={version.id}>

            <ItemListContent

              title={`v${version.versionNumber}`}

              subtitle={`${truncateTemplateBody(version.body, 80)} · ${formatTemplateDateTime(version.createdAt)}`}

            />

            <ItemListMenu ariaLabel={`Actions for version ${version.versionNumber}`}>

              <ItemListMenuItem

                disabled={restoringId === version.id}

                onPress={() => void handleRestore(version.id)}

              >

                Restore

              </ItemListMenuItem>

            </ItemListMenu>

          </ItemListItem>

        ))}

      </ItemList>

    </FeatureScreen>

  )

}


