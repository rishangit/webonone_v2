import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { WebsiteImagePicker } from '../../components/WebsiteImagePicker'
import type { ListDataNode } from '../../document/list'
import type { ListTemplateElement } from '../../document/listTemplateElements'
import type { TemplateHostEditorContext } from '../types'
import { ListManualDataTree, type ListImagePickRequest } from './ListManualDataTree'
import { ListTemplateElementsPanel } from './ListTemplateElementsPanel'

const DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

export function ListManualItemEditDialog({
  open,
  onOpenChange,
  title,
  nodes,
  templateElements,
  templateHostEditor,
  data,
  onSave,
  onNestedDialogOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  nodes: ListDataNode[]
  templateElements: ListTemplateElement[]
  templateHostEditor?: TemplateHostEditorContext | null
  data: Record<string, unknown>
  onSave: (data: Record<string, unknown>) => void
  onNestedDialogOpenChange?: (open: boolean) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState(data)
  const [imagePick, setImagePick] = useState<ListImagePickRequest | null>(null)

  useEffect(() => {
    if (open) setDraft(data)
  }, [open, data])

  useEffect(() => {
    onNestedDialogOpenChange?.(open || imagePick != null)
    return () => onNestedDialogOpenChange?.(false)
  }, [open, imagePick, onNestedDialogOpenChange])

  function submit() {
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        sizeWidth={DIALOG_SIZE.sizeWidth}
        sizeHeight={DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={imagePick != null}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4"
              onClick={() => onOpenChange(false)}
            >
              {tc('cancel')}
            </Button>
            <Button type="button" className="h-10 px-4" onClick={submit}>
              {tc('save')}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('listTemplateElementsHeading')}</p>
            <ListTemplateElementsPanel
              elements={templateElements}
              templateHostEditor={templateHostEditor}
              onEditElement={() => onOpenChange(false)}
            />
          </div>
          {nodes.length > 0 ? (
            <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-4">
              <p className="text-sm font-medium">{t('listItemDataHeading')}</p>
              <ListManualDataTree
                nodes={nodes}
                data={draft}
                onChange={setDraft}
                onRequestImagePick={(request) => setImagePick(request)}
              />
            </div>
          ) : null}
        </div>
      </CustomDialog>
      <WebsiteImagePicker
        open={imagePick != null}
        onClose={() => setImagePick(null)}
        onSelect={(picked) => {
          if (!imagePick) return
          imagePick.applyPick(picked)
          setImagePick(null)
        }}
      />
    </>
  )
}
