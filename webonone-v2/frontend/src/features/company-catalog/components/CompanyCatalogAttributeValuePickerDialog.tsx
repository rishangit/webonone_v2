import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  useToast,
  cn,
} from '@webonone/ui-kit'
import { companyCatalogApi } from '../services/companyCatalogApi'
import {
  formatLibraryAttributeValueLabel,
  type LibraryAttributeValueEntry,
} from '../services/dataLibraryApi'
import type { CatalogGalleryKind } from '../types/companyCatalog.types'

type CompanyCatalogAttributeValuePickerDialogProps = {
  open: boolean
  kind: CatalogGalleryKind
  entityId: string
  attributeName: string
  unitSymbol?: string | null
  values: LibraryAttributeValueEntry[]
  onOpenChange: (open: boolean) => void
  onCopied: () => void
  onCreateNew: () => void
}

export function CompanyCatalogAttributeValuePickerDialog({
  open,
  kind,
  entityId,
  attributeName,
  unitSymbol,
  values,
  onOpenChange,
  onCopied,
  onCreateNew,
}: CompanyCatalogAttributeValuePickerDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedIds([])
    setError(null)
  }, [open])

  const visible = useMemo(() => values, [values])

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function copySelected() {
    setSaving(true)
    setError(null)
    try {
      await companyCatalogApi.copyAttributeValuesFromLibrary(kind, entityId, selectedIds)
      toast({ title: t('attributeDetail.valuesCopied') })
      onCopied()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('attributeDetail.copyValuesFailed')
      setError(message)
      toast({
        title: t('attributeDetail.copyValuesFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('attributeDetail.addValueTitle')}
      description={attributeName}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {tc('cancel')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={saving}
            onClick={onCreateNew}
          >
            {t('attributeDetail.createValue')}
          </Button>
          <Button
            type="button"
            className="h-10"
            disabled={saving || selectedIds.length === 0}
            onClick={() => void copySelected()}
          >
            {t('attributeDetail.addSelectedValues', { count: selectedIds.length })}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {visible.length === 0 ? (
          <ItemListEmpty>{t('attributeDetail.valuePickerEmpty')}</ItemListEmpty>
        ) : (
          <ItemList>
            {visible.map((value) => {
              const selected = selectedIds.includes(value.id)
              const label = formatLibraryAttributeValueLabel(value, unitSymbol)
              return (
                <ItemListItem
                  key={value.id}
                  role="button"
                  tabIndex={0}
                  className={cn('cursor-pointer', selected && itemListRowActiveClassName)}
                  aria-pressed={selected}
                  onClick={() => toggle(value.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggle(value.id)
                    }
                  }}
                >
                  <ItemListContent>
                    <p className="truncate font-medium">{label}</p>
                  </ItemListContent>
                  {selected ? (
                    <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
                  ) : null}
                </ItemListItem>
              )
            })}
          </ItemList>
        )}
      </div>
    </CustomDialog>
  )
}
