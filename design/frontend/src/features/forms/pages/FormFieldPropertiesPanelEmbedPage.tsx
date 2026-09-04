import { useCallback, useEffect, useState } from 'react'
import {
  PlatformPeerPanelEmbedPage,
  subscribePeerPanelDraft,
  writePeerPanelDraft,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { FormDesignerPropsPanel } from '@/features/forms/components/FormDesignerPropsPanel'
import {
  isFormFieldPropertiesPanelState,
  type FormFieldPropertiesPanelDraft,
  type FormFieldPropertiesPanelState,
} from '@/features/forms/utils/formFieldPropertiesPanel'
import type { FormField } from '@/shared/types/design.types'

export function FormFieldPropertiesPanelEmbedPage() {
  return (
    <PlatformPeerPanelEmbedPage<FormFieldPropertiesPanelState>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ requestId, initialDraft }) => (
        <FormFieldPropertiesPanelEmbedBody requestId={requestId} initialDraft={initialDraft} />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function FormFieldPropertiesPanelEmbedBody({
  requestId,
  initialDraft,
}: {
  requestId: string
  initialDraft: FormFieldPropertiesPanelState | null
}) {
  const [field, setField] = useState<FormField | null>(initialDraft?.field ?? null)
  const [fieldIndex, setFieldIndex] = useState(initialDraft?.fieldIndex ?? -1)
  const [fieldCount, setFieldCount] = useState(initialDraft?.fieldCount ?? 0)

  useEffect(() => {
    return subscribePeerPanelDraft<FormFieldPropertiesPanelDraft>(requestId, (draft) => {
      if (!isFormFieldPropertiesPanelState(draft)) {
        return
      }
      setField(draft.field)
      setFieldIndex(draft.fieldIndex)
      setFieldCount(draft.fieldCount)
    })
  }, [requestId])

  const postDraft = useCallback(
    (draft: FormFieldPropertiesPanelDraft) => {
      writePeerPanelDraft(requestId, draft)
    },
    [requestId],
  )

  function handleChange(next: FormField) {
    setField(next)
    postDraft({ kind: 'field', field: next })
  }

  function handleMove(direction: -1 | 1) {
    postDraft({ kind: 'move', direction })
  }

  function handleRemove() {
    postDraft({ kind: 'remove' })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <FormDesignerPropsPanel
        field={field}
        fieldIndex={fieldIndex}
        fieldCount={fieldCount}
        onChange={handleChange}
        onRemove={handleRemove}
        onMove={handleMove}
      />
    </div>
  )
}
