import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutTemplate } from 'lucide-react'
import {
  Button,
  ColorInput,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { containerSettingsSchema } from '../schemas/websiteDesignerSchemas'
import type { WebsiteDocumentV1 } from '../types'

export const CONTAINER_SETTINGS_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface ContentContainerSettingsDialogProps {
  open: boolean
  container: WebsiteDocumentV1['container']
  onOpenChange: (open: boolean) => void
  onSave: (next: WebsiteDocumentV1['container']) => void
}

export function ContentContainerSettingsDialog({
  open,
  container,
  onOpenChange,
  onSave,
}: ContentContainerSettingsDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [height, setHeight] = useState(String(container.height))
  const [backgroundColor, setBackgroundColor] = useState(container.backgroundColor ?? '#ffffff')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (!open) return
    setHeight(String(container.height))
    setBackgroundColor(container.backgroundColor ?? '#ffffff')
    setFieldErrors({})
  }, [container, open])

  function submit() {
    const parsed = containerSettingsSchema.safeParse({ height, backgroundColor })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSave({
      height: parsed.data.height,
      backgroundColor: parsed.data.backgroundColor || undefined,
    })
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('containerSettingsTitle')}
      description={t('containerSettingsDescription')}
      icon={<LayoutTemplate className="h-5 w-5" />}
      sizeWidth={CONTAINER_SETTINGS_DIALOG_SIZE.sizeWidth}
      sizeHeight={CONTAINER_SETTINGS_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit}>
            {t('apply')}
          </Button>
        </>
      }
    >
      <Form className="space-y-4">
        <FormField label={t('containerHeight')} htmlFor="container-settings-height" required error={fieldErrors.height}>
          <Input
            id="container-settings-height"
            type="number"
            min={80}
            max={20000}
            value={height}
            onChange={(event) => setHeight(event.target.value)}
          />
        </FormField>
        <p className="text-xs text-muted-foreground">{t('containerHeightHint')}</p>
        <FormField label={t('background')} htmlFor="container-settings-bg" error={fieldErrors.backgroundColor}>
          <ColorInput
            id="container-settings-bg"
            value={backgroundColor}
            onChange={setBackgroundColor}
          />
        </FormField>
        <div className="rounded-lg border border-[hsl(var(--glass-border))] p-4" style={{ backgroundColor }}>
          <p className="text-sm text-muted-foreground">{t('colorPreview')}</p>
        </div>
      </Form>
    </CustomDialog>
  )
}
