import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { parseCssPaletteSwatches } from '@webonone/theme'
import { Alert, AlertDescription, Button, CustomDialog, Textarea } from '@webonone/mobile-ui'
import { CSS_PALETTE_PLACEHOLDER } from '@/features/design/website/utils/websitePalette'

export function ThemeCssImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (swatches: string[]) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setText('')
    setError(null)
  }, [open])

  function submit() {
    const parsed = parseCssPaletteSwatches(text)
    if (!parsed) {
      setError(t('importPaletteInvalid'))
      return
    }
    onImport(parsed)
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('importPaletteTitle')}
      description={t('importPaletteDescription')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onPress={submit}>{t('importPaletteApply')}</Button>
        </>
      }
    >
      <View className="gap-3">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Textarea
          value={text}
          onChangeText={setText}
          placeholder={CSS_PALETTE_PLACEHOLDER}
          numberOfLines={8}
        />
      </View>
    </CustomDialog>
  )
}
