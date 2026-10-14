import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type { CatalogGalleryKind, WebPublishStatus } from '@/features/company-catalog/types/companyCatalog.types'

type CatalogWebPublishDialogProps = {
  open: boolean
  kind: CatalogGalleryKind
  id: string
  webPublishStatus: WebPublishStatus
  onOpenChange: (open: boolean) => void
}

export function CatalogWebPublishDialog({
  open,
  kind,
  id,
  webPublishStatus,
  onOpenChange,
}: CatalogWebPublishDialogProps) {
  const { t } = useTranslation('catalog')
  const dispatch = useAppDispatch()
  const mutateStatus = useAppSelector((s) => s.companyCatalog.mutateStatus)
  const mutateError = useAppSelector((s) => s.companyCatalog.mutateError)
  const [value, setValue] = useState<WebPublishStatus>(webPublishStatus)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setValue(webPublishStatus)
    setSubmitted(false)
    dispatch(companyCatalogActions.clearMutateError())
  }, [open, webPublishStatus, dispatch])

  useEffect(() => {
    if (!submitted || mutateStatus === 'saving') return
    if (mutateError) {
      setSubmitted(false)
      return
    }
    if (mutateStatus === 'idle') {
      setSubmitted(false)
      onOpenChange(false)
    }
  }, [mutateStatus, mutateError, submitted, onOpenChange])

  function handleSave() {
    setSubmitted(true)
    dispatch(companyCatalogActions.updateWebPublishRequested({ kind, id, webPublishStatus: value }))
  }

  const busy = mutateStatus === 'saving'

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title={t('detail.webPublish.dialogTitle')}
      description={t('detail.webPublish.dialogDescription')}
      sizeWidth="small"
      sizeHeight="auto"
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" className="h-10" onClick={handleSave} disabled={busy}>
            Save
          </Button>
        </>
      }
    >
      {mutateError ? (
        <Alert variant="destructive">
          <AlertDescription>{mutateError}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label={t('detail.webPublish.statusLabel')} htmlFor="catalog-web-publish-status">
        <Select
          value={value}
          onValueChange={(next) => setValue(next as WebPublishStatus)}
          disabled={busy}
        >
          <SelectTrigger id="catalog-web-publish-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{t('detail.webPublish.draft')}</SelectItem>
            <SelectItem value="published">{t('detail.webPublish.published')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </CustomDialog>
  )
}
