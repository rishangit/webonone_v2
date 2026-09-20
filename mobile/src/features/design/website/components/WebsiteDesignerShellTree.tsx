import { useCallback, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WebsiteContentTree } from '@/features/design/website/components/WebsiteContentTree'
import {
  changeTemplateAddonLayer,
  changeTemplateBlockLayer,
  deleteTemplateAddon,
  deleteTemplateBlock,
  duplicateTemplateBlock,
} from '@/features/design/website/document/slider'
import {
  changeLayer,
  deleteAddon,
  deleteBlock,
  duplicateAddon,
  duplicateBlock,
} from '@/features/design/website/document/blockTree'
import type {
  DesignerSelection,
  WebsiteDesignerKind,
  WebsiteDocumentV1,
} from '@/features/design/website/types'
import { useShellStartPanelContext } from '@/features/shell/context/ShellStartPanelContext'

export function WebsiteDesignerShellTree({
  open,
  onClose,
  document,
  selection,
  canManage,
  kind,
  onSelect,
  onDocumentChange,
  onSelectionChange,
  onOpenContainerSettings,
  onOpenBlockSettings,
  onOpenAddonSettings,
  onSaveAsPreset,
}: {
  open: boolean
  onClose: () => void
  document: WebsiteDocumentV1
  selection: DesignerSelection
  canManage: boolean
  kind: WebsiteDesignerKind
  onSelect: (selection: DesignerSelection) => void
  onDocumentChange: (updater: (prev: WebsiteDocumentV1) => WebsiteDocumentV1) => void
  onSelectionChange: (selection: DesignerSelection) => void
  onOpenContainerSettings: () => void
  onOpenBlockSettings: () => void
  onOpenAddonSettings: () => void
  onSaveAsPreset: (blockId: string) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { setPanel } = useShellStartPanelContext()

  const selectFromTree = useCallback(
    (next: DesignerSelection) => {
      onSelect(next)
      onClose()
    },
    [onClose, onSelect],
  )

  const handleLayer = useCallback(
    (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => {
      onDocumentChange((prev) => changeLayer(prev, target, direction))
    },
    [onDocumentChange],
  )

  useLayoutEffect(() => {
    if (!open) {
      setPanel(null)
      return
    }

    setPanel({
      open: true,
      onClose,
      title: t('contentTree'),
      closeLabel: tc('close'),
      contentContainerClassName: 'p-2',
      children: (
        <WebsiteContentTree
          document={document}
          selection={selection}
          canManage={canManage}
          onSelect={selectFromTree}
          onLayer={handleLayer}
          onDeleteBlock={(blockId) => {
            onDocumentChange((prev) => deleteBlock(prev, blockId))
            onSelectionChange({ kind: 'container' })
          }}
          onDeleteAddon={(blockId, addonId) => {
            onDocumentChange((prev) => deleteAddon(prev, blockId, addonId))
            onSelectionChange({ kind: 'block', blockId })
          }}
          onDuplicateBlock={(blockId) => {
            const result = duplicateBlock(document, blockId)
            if (!result) return
            onDocumentChange(() => result.document)
            onSelectionChange({ kind: 'block', blockId: result.id })
          }}
          onDuplicateAddon={(blockId, addonId) => {
            const result = duplicateAddon(document, blockId, addonId)
            if (!result) return
            onDocumentChange(() => result.document)
            onSelectionChange({ kind: 'addon', blockId, addonId: result.id })
          }}
          onOpenContainerSettings={onOpenContainerSettings}
          onOpenBlockSettings={onOpenBlockSettings}
          onOpenAddonSettings={onOpenAddonSettings}
          onOpenTemplateBlockSettings={onOpenBlockSettings}
          onOpenTemplateAddonSettings={onOpenAddonSettings}
          onLayerTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId, direction) => {
            onDocumentChange((prev) =>
              changeTemplateBlockLayer(prev, hostBlockId, sliderAddonId, templateBlockId, direction),
            )
          }}
          onDeleteTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId) => {
            onDocumentChange((prev) => deleteTemplateBlock(prev, hostBlockId, sliderAddonId, templateBlockId))
            onSelectionChange({ kind: 'addon', blockId: hostBlockId, addonId: sliderAddonId })
          }}
          onDuplicateTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId) => {
            const result = duplicateTemplateBlock(document, hostBlockId, sliderAddonId, templateBlockId)
            if (!result) return
            onDocumentChange(() => result.document)
            onSelectionChange({
              kind: 'templateBlock',
              hostBlockId,
              sliderAddonId,
              templateBlockId: result.id,
            })
          }}
          onLayerTemplateAddon={(hostBlockId, sliderAddonId, templateBlockId, templateAddonId, direction) => {
            onDocumentChange((prev) =>
              changeTemplateAddonLayer(
                prev,
                hostBlockId,
                sliderAddonId,
                templateBlockId,
                templateAddonId,
                direction,
              ),
            )
          }}
          onDeleteTemplateAddon={(hostBlockId, sliderAddonId, templateBlockId, templateAddonId) => {
            onDocumentChange((prev) =>
              deleteTemplateAddon(prev, hostBlockId, sliderAddonId, templateBlockId, templateAddonId),
            )
            onSelectionChange({ kind: 'templateBlock', hostBlockId, sliderAddonId, templateBlockId })
          }}
          onSaveAsPreset={onSaveAsPreset}
          saveAsPresetDisabled={kind === 'presets'}
        />
      ),
    })

    return () => setPanel(null)
  }, [
    canManage,
    document,
    handleLayer,
    kind,
    onClose,
    onOpenAddonSettings,
    onOpenBlockSettings,
    onOpenContainerSettings,
    onDocumentChange,
    onSaveAsPreset,
    onSelectionChange,
    open,
    selectFromTree,
    selection,
    setPanel,
    t,
    tc,
  ])

  return null
}
