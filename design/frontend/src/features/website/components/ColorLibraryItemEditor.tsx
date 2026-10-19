import { useTranslation } from 'react-i18next'
import {
  EditableSectionCard,
  ItemList,
  ItemListContent,
  ItemListItem,
  ReadOnlyField,
  itemListRowBodyClassName,
} from '@webonone/ui-kit'
import type { WebsiteColorLibraryItem } from '../types'
import { ColorPaletteSwatchStrip } from './ColorPaletteSwatchStrip'

export type ColorLibraryEditSection = 'overview' | 'colors'

export function ColorLibraryItemEditor({
  item,
  onEdit,
}: {
  item: WebsiteColorLibraryItem
  onEdit: (section: ColorLibraryEditSection) => void
}) {
  const { t } = useTranslation('website')

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <EditableSectionCard
          title={t('paletteColorsListTitle')}
          description={t('paletteColorsListDescription')}
          canEdit
          onEdit={() => onEdit('colors')}
        >
          <ItemList>
            {item.palette.colors.map((color, index) => (
              <ItemListItem key={`${color.name}-${color.value}-${index}`}>
                <ItemListContent>
                  <div className={itemListRowBodyClassName}>
                    <span
                      className="h-14 w-14 shrink-0 self-start rounded-md border border-[hsl(var(--glass-border))]"
                      style={{ backgroundColor: color.value }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{color.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{color.value}</p>
                    </div>
                  </div>
                </ItemListContent>
              </ItemListItem>
            ))}
          </ItemList>
        </EditableSectionCard>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title={t('paletteOverviewTitle')}
          description={t('paletteOverviewDescription')}
          canEdit
          onEdit={() => onEdit('overview')}
        >
          <div className="space-y-4">
            <ReadOnlyField label={t('paletteName')} value={item.name} />
            <ReadOnlyField
              label={t('paletteColorCountLabel')}
              value={t('colorPaletteColorCount', { count: item.palette.colors.length })}
            />
            <ColorPaletteSwatchStrip palette={item.palette} sizeClassName="h-10 w-10" />
          </div>
        </EditableSectionCard>
      </div>
    </div>
  )
}
