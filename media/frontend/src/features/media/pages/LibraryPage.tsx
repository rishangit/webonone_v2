import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { ImageCropDialog } from '@/features/media/components/ImageCropDialog'
import { ScopedFolderBrowser } from '@/features/media/components/ScopedFolderBrowser'
import { useScopedNavigation } from '@/features/media/hooks/useScopedNavigation'
import { mediaActions } from '@/features/media/store'

const LIBRARY_SCOPE = 'media:library:default'
const LIBRARY_ROOT = '/'

export function LibraryPage() {
  const { t } = useTranslation('library')

  const dispatch = useAppDispatch()
  const { currentPath } = useScopedNavigation(LIBRARY_ROOT)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [cropOpen, setCropOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const uploadPendingRef = useRef(false)

  const { uploadStatus, lastUploadedItems, uploadError: storeUploadError, lastUploadFailed } =
    useAppSelector((s) => s.media)

  useEffect(() => {
    if (!uploadPendingRef.current || uploadStatus === 'uploading') {
      return
    }
    if (uploadStatus === 'error') {
      setUploadError(storeUploadError ?? t('uploadFailed'))
      uploadPendingRef.current = false
      dispatch(mediaActions.resetUpload())
      return
    }
    if (lastUploadFailed.length) {
      setUploadError(lastUploadFailed.map((f) => `${f.fileName}: ${f.reason}`).join('; '))
    } else {
      setUploadError(null)
      setRefreshKey((key) => key + 1)
    }
    uploadPendingRef.current = false
    dispatch(mediaActions.resetUpload())
  }, [dispatch, lastUploadFailed, lastUploadedItems, storeUploadError, uploadStatus])

  function uploadFile(file: File) {
    setUploadError(null)
    uploadPendingRef.current = true
    dispatch(
      mediaActions.uploadRequested({
        files: [file],
        scope: LIBRARY_SCOPE,
        folderPath: currentPath,
      }),
    )
  }

  async function handleFilesSelected(files: File[]) {
    const file = files[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      setPendingFile(file)
      setCropOpen(true)
      return
    }

    uploadFile(file)
  }

  async function handleCropConfirm(cropped: File) {
    setCropOpen(false)
    setPendingFile(null)
    uploadFile(cropped)
  }

  return (
    <FeaturePage
      title={t('title')}
      description={t('description')}
    >
      <ScopedFolderBrowser
        scope={LIBRARY_SCOPE}
        scopedRoot={LIBRARY_ROOT}
        mode="multiple"
        refreshKey={refreshKey}
        showIconToolbar
        allowDelete
        enableUpload
        hostLoading
        uploadAccept="*/*"
        uploadError={uploadError}
        onUploadFiles={handleFilesSelected}
      />

      <ImageCropDialog
        open={cropOpen}
        file={pendingFile}
        defaultAspect="1:1"
        aspectPresets={['1:1', '4:3', '16:9', 'free']}
        onConfirm={(file) => void handleCropConfirm(file)}
        onCancel={() => {
          setCropOpen(false)
          setPendingFile(null)
        }}
      />
    </FeaturePage>
  )
}
