import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  resolvePlatformEmbedParentOrigin,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import {
  buildDesignFillPath,
  buildDesignFormPeerDialogPath,
  DESIGN_FORM_FILL_DIALOG_SIZE,
  getDesignFormDialogCopy,
  getDesignOrigin,
  type DesignFormDialogSubject,
} from '@/features/users/services/userHistoryApi'

/**
 * Opens Design fill/view as a core-hosted peer dialog when Identity is embedded.
 * Standalone: hard-redirects to the WebOnOne Design shell path.
 */
export function useOpenDesignFormDialog(onResult?: () => void) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [subject, setSubject] = useState<DesignFormDialogSubject | null>(null)
  const [openKey, setOpenKey] = useState(0)

  const mode = subject?.mode === 'view' ? 'view' : 'fill'
  const copy = getDesignFormDialogCopy(
    subject?.subjectDisplayName ?? 'Customer',
    subject?.serviceName,
    mode,
  )
  const path = subject ? buildDesignFormPeerDialogPath(subject) : '/embed/dialogs/forms/fill'

  useRequestPlatformPeerDialog({
    parentOrigin,
    open: Boolean(parentOrigin && subject),
    openKey,
    path,
    title: copy.title,
    description: copy.description,
    cancelLabel: mode === 'view' ? 'Close' : 'Cancel',
    submitLabel: mode === 'view' ? null : 'Submit',
    bodyOrigin: getDesignOrigin(),
    ...DESIGN_FORM_FILL_DIALOG_SIZE,
    onResult: () => {
      setSubject(null)
      onResult?.()
    },
    onCancel: () => setSubject(null),
  })

  useEffect(() => {
    if (parentOrigin || !subject) return
    const shellPath = buildDesignFillPath(subject.formTemplateId, subject)
    const webononeOrigin = import.meta.env.VITE_WEBONONE_ORIGIN ?? 'http://127.0.0.1:3010'
    window.location.assign(`${webononeOrigin.replace(/\/$/, '')}${shellPath}`)
    setSubject(null)
  }, [parentOrigin, subject])

  function open(next: DesignFormDialogSubject) {
    setSubject(next)
    setOpenKey((k) => k + 1)
  }

  return { open }
}
