import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListAddButton,
  useToast,
} from '@webonone/ui-kit'
import { CompanyCatalogAttributeAiMenuItem } from './CompanyCatalogAttributeAiMenuItem'
import { CompanyCatalogAttributePickerDialog } from './CompanyCatalogAttributePickerDialog'
import { companyCatalogApi, type CompanyCatalogAttribute } from '../services/companyCatalogApi'
import { formatLibraryAttributeValueLabel } from '../services/dataLibraryApi'
import {
  CATALOG_ENTITY_SINGULAR_KEYS,
  type CatalogGalleryKind,
} from '../types/companyCatalog.types'

type CompanyCatalogAttributesTabProps = {
  kind: CatalogGalleryKind
  entityId: string
  entityName: string
  libraryEntityId: string | null
  canAdd: boolean
}

export function CompanyCatalogAttributesTab({
  kind,
  entityId,
  entityName,
  libraryEntityId,
  canAdd,
}: CompanyCatalogAttributesTabProps) {
  const { t } = useTranslation('catalog')
  const navigate = useNavigate()
  const { toast } = useToast()
  const [attributes, setAttributes] = useState<CompanyCatalogAttribute[]>([])
  const [linkedLibraryId, setLinkedLibraryId] = useState<string | null>(libraryEntityId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.listCopiedAttributes(kind, entityId)
      setAttributes(result.attributes)
      setLinkedLibraryId(result.libraryEntityId ?? libraryEntityId)
    } catch (err) {
      setAttributes([])
      setError(err instanceof Error ? err.message : t('attributesTab.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [entityId, kind, libraryEntityId, t])

  useEffect(() => {
    void load()
  }, [load])

  const noun = t(`entities.${CATALOG_ENTITY_SINGULAR_KEYS[kind]}`)

  async function removeAttribute(attributeId: string) {
    setBusy(true)
    try {
      await companyCatalogApi.deleteCopiedAttribute(kind, entityId, attributeId)
      toast({ title: t('attributesTab.removed') })
      await load()
    } catch (err) {
      toast({
        title: t('attributesTab.removeFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('detail.tabs.attributes')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('attributesTab.copiedHint', { noun })}
          </p>
        </div>
        {canAdd ? (
          <ListAddButton
            className="self-end sm:self-auto"
            onClick={() => setPickerOpen(true)}
            disabled={loading || busy}
          >
            {t('attributesTab.add')}
          </ListAddButton>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && attributes.length === 0 ? (
        <ItemListEmpty>{t('attributesTab.loading')}</ItemListEmpty>
      ) : attributes.length === 0 ? (
        <ItemListEmpty>{t('attributesTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {attributes.map((attr) => {
            const rowBody = (
              <>
                <p className="truncate font-medium">{attr.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  <span className="capitalize">{attr.valueType}</span>
                  {attr.unit ? ` · ${attr.unit.name} (${attr.unit.symbol})` : ''}
                  {` · ${t('attributesTab.valueCount', { count: attr.values.length })}`}
                </p>
                {attr.values.length > 0 ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {attr.values
                      .map((value) => formatLibraryAttributeValueLabel(value, attr.unit?.symbol))
                      .join(' · ')}
                  </p>
                ) : null}
              </>
            )
            return (
              <ItemListItem key={attr.attributeId}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      navigate(`/data/${kind}/${entityId}/attributes/${attr.attributeId}`)
                    }
                  >
                    {rowBody}
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={t('attributesTab.actionsFor', { name: attr.name })}>
                  {linkedLibraryId ? (
                    <CompanyCatalogAttributeAiMenuItem
                      kind={kind}
                      libraryEntityId={linkedLibraryId}
                      entityName={entityName}
                      attributeId={attr.attributeId}
                      attributeName={attr.name}
                      mode="copy"
                    />
                  ) : null}
                  {canAdd ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={busy}
                      onClick={() => void removeAttribute(attr.attributeId)}
                    >
                      {t('attributesTab.remove')}
                    </DropdownMenuItem>
                  ) : null}
                </ItemListMenu>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}

      <CompanyCatalogAttributePickerDialog
        open={pickerOpen}
        kind={kind}
        entityId={entityId}
        libraryEntityId={linkedLibraryId}
        copiedAttributes={attributes}
        onOpenChange={setPickerOpen}
        onCopied={(nextLibraryId) => {
          if (nextLibraryId) setLinkedLibraryId(nextLibraryId)
          void load()
        }}
      />
    </div>
  )
}
