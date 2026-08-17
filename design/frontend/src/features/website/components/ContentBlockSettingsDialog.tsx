import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import {
  Button,
  ColorInput,
  CustomDialog,
  Form,
  FormField,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { blockSettingsSchema } from '../schemas/websiteDesignerSchemas'
import type { WebsiteBlock } from '../types'

export const BLOCK_SETTINGS_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface ContentBlockSettingsDialogProps {
  open: boolean
  block: WebsiteBlock | null
  onOpenChange: (open: boolean) => void
  onSave: (blockId: string, backgroundColor: string | undefined) => void
}

export function ContentBlockSettingsDialog({
  open,
  block,
  onOpenChange,
  onSave,
}: ContentBlockSettingsDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [tab, setTab] = useState('basic')
  const [backgroundColor, setBackgroundColor] = useState(block?.backgroundColor ?? '#ffffff')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setTab('basic')
    setBackgroundColor(block?.backgroundColor ?? '#ffffff')
    setFieldErrors({})
  }, [block, open])

  function submit() {
    const parsed = blockSettingsSchema.safeParse({ backgroundColor })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    if (!block) return
    setFieldErrors({})
    onSave(block.id, parsed.data.backgroundColor || undefined)
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('blockSettingsTitle')}
      description={t('blockSettingsDescription')}
      icon={<Settings2 className="h-5 w-5" />}
      sizeWidth={BLOCK_SETTINGS_DIALOG_SIZE.sizeWidth}
      sizeHeight={BLOCK_SETTINGS_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={!block}>
            {t('apply')}
          </Button>
        </>
      }
    >
      <Form className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label={t('blockSettingsTitle')}>
            <TabsTrigger value="basic">{t('basicSetting')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('advancedSetting')}</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-4">
            <FormField label={t('background')} htmlFor="block-settings-bg" error={fieldErrors.backgroundColor}>
              <ColorInput
                id="block-settings-bg"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />
            </FormField>
            <div className="rounded-lg border border-[hsl(var(--glass-border))] p-4" style={{ backgroundColor }}>
              <p className="text-sm text-muted-foreground">{t('colorPreview')}</p>
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <p className="text-sm text-muted-foreground">{t('advancedSettingPlaceholder')}</p>
          </TabsContent>
        </Tabs>
      </Form>
    </CustomDialog>
  )
}
