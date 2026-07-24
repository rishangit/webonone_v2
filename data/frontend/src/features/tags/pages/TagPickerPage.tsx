import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  isDataTagPickerSetSelectionMessage,
  PLATFORM_EMBED_QUERY,
  sendDataTagPickerCreateRequest,
  sendDataTagPickerSelectionChange,
  type DataTagPickerTag,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, Spinner } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { TagPickerPanel } from '@/features/tags/components/TagPickerPanel'
import type { Tag } from '@/shared/types/data.types'

function toPickerTag(tag: Tag | DataTagPickerTag): DataTagPickerTag {
  return { id: tag.id, name: tag.name, color: tag.color }
}

export function TagPickerPage() {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEmbed = searchParams.get(PLATFORM_EMBED_QUERY.EMBED) === PLATFORM_EMBED_QUERY.EMBED_VALUE
  const scope = (searchParams.get(PLATFORM_EMBED_QUERY.SCOPE) ?? '').trim()
  const multiple = searchParams.get(PLATFORM_EMBED_QUERY.MODE) === 'multiple'
  const isValid = isEmbed && Boolean(parentOrigin) && scope.length > 0

  const [selectedTags, setSelectedTags] = useState<DataTagPickerTag[]>([])

  const notifySelectionChange = useCallback(
    (nextSelectedTags: DataTagPickerTag[]) => {
      if (!parentOrigin || !scope) {
        return
      }
      sendDataTagPickerSelectionChange(parentOrigin, scope, nextSelectedTags)
    },
    [parentOrigin, scope],
  )

  useEffect(() => {
    if (!parentOrigin || !scope) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) {
        return
      }
      if (!isDataTagPickerSetSelectionMessage(event.data) || event.data.scope !== scope) {
        return
      }

      const nextSelectedTags = multiple
        ? event.data.tags.map(toPickerTag)
        : event.data.tags.slice(0, 1).map(toPickerTag)

      setSelectedTags(nextSelectedTags)
      notifySelectionChange(nextSelectedTags)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [multiple, notifySelectionChange, parentOrigin, scope])

  function handleSelectionChange(nextSelectedTags: DataTagPickerTag[]) {
    setSelectedTags(nextSelectedTags)
    notifySelectionChange(nextSelectedTags)
  }

  function handleCreateClick() {
    if (!parentOrigin || !scope) {
      return
    }
    sendDataTagPickerCreateRequest(parentOrigin, scope)
  }

  if (!isValid) {
    return (
      <div className="mx-auto flex min-h-[320px] w-full max-w-3xl items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertDescription>
            This page is available only for platform iframe embeds with a valid parent origin and scope.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
      </div>
    )
  }

  return (
    <TagPickerPanel
      enabled
      multiple={multiple}
      selectedTags={selectedTags}
      onSelectionChange={handleSelectionChange}
      onCreateRequest={handleCreateClick}
    />
  )
}
