import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListAddButton,
  PriceDisplay,
  useToast,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import { CatalogPriceRuleFormDialog } from '@/features/company-catalog/components/CatalogPriceRuleFormDialog'
import type {
  CatalogPriceKind,
  CatalogPriceRule,
} from '@/features/company-catalog/types/catalogPriceRule.types'
import { formatCatalogPriceWhen } from '@/features/company-catalog/utils/formatCatalogPriceWhen'

type CatalogPriceListTabProps = {
  kind: CatalogPriceKind
  entityId: string
  rules: CatalogPriceRule[]
  loading: boolean
  error: string | null
  canEdit: boolean
  onChanged: () => void
}

function ruleSummary(
  rule: CatalogPriceRule,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const when = formatCatalogPriceWhen(rule, t)
  const whom =
    rule.applyTo === 'everyone'
      ? t('priceList.everyone')
      : rule.users.map((user) => user.displayName).join(', ') || t('priceList.selectedUsers')
  return `${when} · ${whom}`
}

export function CatalogPriceListTab({
  kind,
  entityId,
  rules,
  loading,
  error,
  canEdit,
  onChanged,
}: CatalogPriceListTabProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [dialogRule, setDialogRule] = useState<CatalogPriceRule | null | undefined>(undefined)
  const [pendingRemove, setPendingRemove] = useState<CatalogPriceRule | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleRemove(rule: CatalogPriceRule) {
    setBusy(true)
    try {
      await companyCatalogApi.deletePriceRule(kind, entityId, rule.id)
      toast({ title: t('priceList.removed') })
      onChanged()
    } catch (err) {
      toast({
        title: t('priceList.removeFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
      setPendingRemove(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('priceList.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('priceList.description')}</p>
        </div>
        {canEdit ? (
          <ListAddButton
            className="self-end sm:self-auto"
            onClick={() => setDialogRule(null)}
            disabled={busy || loading}
          >
            {t('priceList.add')}
          </ListAddButton>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && rules.length === 0 ? (
        <ItemListEmpty>{t('priceList.loading')}</ItemListEmpty>
      ) : rules.length === 0 ? (
        <ItemListEmpty>{t('priceList.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {rules.map((rule) => (
            <ItemListItem key={rule.id}>
              <ItemListContent>
                <PriceDisplay value={rule.price} size="sm" />
                <p className="truncate text-sm text-muted-foreground">{ruleSummary(rule, t)}</p>
              </ItemListContent>
              {canEdit ? (
                <ItemListMenu ariaLabel={t('priceList.actionsFor', { price: rule.price })}>
                  <DropdownMenuItem disabled={busy} onClick={() => setDialogRule(rule)}>
                    {tc('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={busy}
                    onClick={() => setPendingRemove(rule)}
                  >
                    {tc('remove')}
                  </DropdownMenuItem>
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          ))}
        </ItemList>
      )}

      <CatalogPriceRuleFormDialog
        open={dialogRule !== undefined}
        kind={kind}
        entityId={entityId}
        rule={dialogRule ?? null}
        onOpenChange={(next) => {
          if (!next) setDialogRule(undefined)
        }}
        onSaved={onChanged}
      />

      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={t('priceList.removeTitle')}
        description={t('priceList.removeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('remove')}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        onConfirm={() => {
          if (pendingRemove) void handleRemove(pendingRemove)
        }}
      />
    </div>
  )
}
