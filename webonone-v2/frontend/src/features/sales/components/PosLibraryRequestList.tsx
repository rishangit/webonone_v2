import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenuItem,
  ImagePreview,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
} from '@webonone/ui-kit'
import type { PosLibraryRequest } from '@/features/sales/types/sales.types'

type PosLibraryRequestListProps = {
  requests: PosLibraryRequest[]
  readOnly?: boolean
  onQuantityChange?: (key: string, quantity: number) => void
  onRemove?: (key: string) => void
}

export function PosLibraryRequestList({
  requests,
  readOnly = false,
  onQuantityChange,
  onRemove,
}: PosLibraryRequestListProps) {
  const { t } = useTranslation('sales')

  if (requests.length === 0) {
    return <ItemListEmpty>{t('pos.libraryRequestsEmpty')}</ItemListEmpty>
  }

  return (
    <ItemList className="py-0">
      {requests.map((request) => (
        <ItemListItem key={request.key}>
          <ItemListContent>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <ImagePreview
                  src={request.imageUrl ?? null}
                  alt={request.name}
                  mode="view"
                  className={itemListThumbClassName}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{request.name}</p>
                  <p className="text-xs text-muted-foreground">{t(`kinds.${request.itemKind}`)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                {readOnly ? (
                  <p className="text-xs text-muted-foreground">
                    {t('pos.qty')}: {request.quantity}
                  </p>
                ) : (
                  <label className="space-y-1 text-xs text-muted-foreground">
                    {t('pos.qty')}
                    <Input
                      className="w-20"
                      type="number"
                      min={0.001}
                      step="1"
                      value={String(request.quantity)}
                      onChange={(e) => onQuantityChange?.(request.key, Number(e.target.value))}
                      aria-label={t('pos.quantityAria', { name: request.name })}
                    />
                  </label>
                )}
              </div>
            </div>
          </ItemListContent>
          {!readOnly ? (
            <ItemListMenu ariaLabel={t('pos.lineActionsAria', { name: request.name })}>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove?.(request.key)}
              >
                {t('pos.remove')}
              </DropdownMenuItem>
            </ItemListMenu>
          ) : null}
        </ItemListItem>
      ))}
    </ItemList>
  )
}

type PosLibraryRequestsCardProps = {
  requests: PosLibraryRequest[]
  readOnly?: boolean
  onQuantityChange?: (key: string, quantity: number) => void
  onRemove?: (key: string) => void
}

export function PosLibraryRequestsCard({
  requests,
  readOnly = false,
  onQuantityChange,
  onRemove,
}: PosLibraryRequestsCardProps) {
  const { t } = useTranslation('sales')

  return (
    <Card variant="list">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-lg">{t('pos.libraryRequestsTitle')}</CardTitle>
        <CardDescription>{t('pos.libraryRequestsHelp')}</CardDescription>
      </CardHeader>
      <CardContent>
        <PosLibraryRequestList
          requests={requests}
          readOnly={readOnly}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      </CardContent>
    </Card>
  )
}
