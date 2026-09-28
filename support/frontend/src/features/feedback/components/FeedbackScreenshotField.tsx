import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MediaSelectorFrame,
  useMediaEmbedMessage,
  type MediaItemDto,
} from '@webonone/media-embed'
import { Button, CustomDialog, FormField, SelectMedia, type SelectMediaValue } from '@webonone/ui-kit'
import {
  buildSupportFeedbackMediaScope,
  FEEDBACK_SCREENSHOT_ACCEPT,
  FEEDBACK_SCREENSHOT_FOLDER_PATH,
  getMediaOrigin,
  getMediaSelectorUrl,
} from '@/features/media/utils/mediaConfig'

type FeedbackScreenshotFieldProps = {
  accessToken: string | null
  uploadSessionId: string
  value: SelectMediaValue | null
  onChange: (value: SelectMediaValue | null) => void
  error?: string
}

function toSelectMediaValue(item: MediaItemDto): SelectMediaValue {
  return {
    id: item.id,
    url: item.url,
    fileName: item.fileName,
    mimeType: item.mimeType,
  }
}

export function FeedbackScreenshotField({
  accessToken,
  uploadSessionId,
  value,
  onChange,
  error,
}: FeedbackScreenshotFieldProps) {
  const { t } = useTranslation('feedback')
  const { t: tc } = useTranslation('common')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerAttempt, setPickerAttempt] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const mediaOrigin = useMemo(() => getMediaOrigin(), [])
  const scope = buildSupportFeedbackMediaScope(uploadSessionId)
  const canOpen = Boolean(accessToken) && mediaOrigin.length > 0

  const handleSelect = useCallback(
    (items: MediaItemDto[]) => {
      const item = items[0]
      if (!item) {
        return
      }
      onChange(toSelectMediaValue(item))
      setPickerOpen(false)
    },
    [onChange],
  )

  useMediaEmbedMessage({
    mediaOrigin,
    onSelect: (message) => {
      if (message.scope !== scope) {
        return
      }
      handleSelect(message.items)
    },
    onCancel: () => {
      setPickerOpen(false)
    },
  })

  function openPicker() {
    if (!canOpen) {
      return
    }
    setPickerOpen(true)
    setPickerAttempt((attempt) => attempt + 1)
  }

  return (
    <>
      <FormField
        htmlFor="feedback-screenshot"
        label={t('fields.screenshot')}
        error={error}
      >
        <div className="flex flex-col gap-2">
          <SelectMedia
            id="feedback-screenshot"
            selectedItem={value}
            placeholder={t('fields.screenshotPlaceholder')}
            onClick={openPicker}
            disabled={!canOpen}
            aria-label={t('fields.screenshotAria')}
          />
          {value ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 w-fit"
              onClick={() => onChange(null)}
            >
              {t('fields.screenshotRemove')}
            </Button>
          ) : null}
          {!accessToken ? (
            <p className="text-xs text-muted-foreground">{t('fields.screenshotWaitingAuth')}</p>
          ) : null}
        </div>
      </FormField>

      <CustomDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={t('fields.screenshotPickerTitle')}
        description={t('fields.screenshotPickerDescription')}
        sizeWidth="large"
        sizeHeight="xlarge"
        noContentPadding
        disableContentScroll
        footer={
          <Button type="button" variant="outline" className="h-10" onClick={() => setPickerOpen(false)}>
            {tc('close')}
          </Button>
        }
      >
        {canOpen ? (
          <MediaSelectorFrame
            key={`${pickerAttempt}-${accessToken}`}
            ref={iframeRef}
            isOpen={pickerOpen}
            accessToken={accessToken}
            mediaOrigin={mediaOrigin}
            baseUrl={getMediaSelectorUrl()}
            parentOrigin={window.location.origin}
            scope={scope}
            folderPath={FEEDBACK_SCREENSHOT_FOLDER_PATH}
            scopedRoot={FEEDBACK_SCREENSHOT_FOLDER_PATH}
            mode="single"
            accept={FEEDBACK_SCREENSHOT_ACCEPT}
            selectorUpload
            className="block h-full min-h-[420px] w-full border-0 bg-transparent"
          />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">{t('fields.screenshotUnavailable')}</p>
        )}
      </CustomDialog>
    </>
  )
}
