import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CatalogAttributeValuesPanel } from '@/features/catalog/components/CatalogAttributeValuesPanel'
import { type CatalogEntityKind } from '@/features/catalog/utils/catalogAttributeApi'
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
import type {
  CatalogAttributeValue,
  CatalogAttributeValueEntry,
} from '@/shared/types/data.types'

export const ATTRIBUTE_VALUE_DIALOG_SIZE = {
  sizeWidth: DATA_FORM_DIALOG_SIZE.sizeWidth,
  sizeHeight: DATA_FORM_DIALOG_SIZE.sizeHeight,
}

export function attributeValueCreateEmbedPath(
  kind: CatalogEntityKind,
  entityId: string,
  attributeId: string,
): string {
  return `/embed/dialogs/${kind}/${entityId}/attributes/${attributeId}/values/create`
}

export function attributeValueEditEmbedPath(
  kind: CatalogEntityKind,
  entityId: string,
  attributeId: string,
  valueId: string,
): string {
  return `/embed/dialogs/${kind}/${entityId}/attributes/${attributeId}/values/${valueId}/edit`
}

type CatalogAttributeValueDialogProps = {
  open: boolean
  kind: CatalogEntityKind
  entityId: string
  attribute: CatalogAttributeValue
  value?: CatalogAttributeValueEntry | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function CatalogAttributeValueDialog({
  open,
  kind,
  entityId,
  attribute,
  value = null,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: CatalogAttributeValueDialogProps) {
  const { t } = useTranslation(kind)
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(value)
  const title = isEdit ? t('catalog.editValueTitle') : t('catalog.addValueTitle')
  const path = isEdit && value
    ? attributeValueEditEmbedPath(kind, entityId, attribute.attributeId, value.id)
    : attributeValueCreateEmbedPath(kind, entityId, attribute.attributeId)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    description: attribute.name,
    submitLabel: null,
    cancelLabel: t('common:close'),
    ...ATTRIBUTE_VALUE_DIALOG_SIZE,
    onResult: () => {
      onSaved()
      onOpenChange(false)
    },
    onCancel: () => {
      onSaved()
      onOpenChange(false)
    },
  })

  function handleSavingChange(saving: boolean) {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, saving, undefined, {
      description: attribute.name,
    })
  }

  const panel = (
    <CatalogAttributeValuesPanel
      kind={kind}
      entityId={entityId}
      attribute={attribute}
      canEdit
      active={open || chrome === 'embed-page'}
      initialEditingValue={value}
      onChanged={onSaved}
      onSavingChange={handleSavingChange}
    />
  )

  const actions = (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
      onClick={() => onOpenChange(false)}
    >
      {t('common:close')}
    </Button>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{panel}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={attribute.name}
      sizeWidth={ATTRIBUTE_VALUE_DIALOG_SIZE.sizeWidth}
      sizeHeight={ATTRIBUTE_VALUE_DIALOG_SIZE.sizeHeight}
      footer={actions}
    >
      {panel}
    </CustomDialog>
  )
}
