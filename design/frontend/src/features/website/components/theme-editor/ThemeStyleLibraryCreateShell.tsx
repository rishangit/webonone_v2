import type { ReactNode } from 'react'
import { Library, Plus } from 'lucide-react'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Spinner,
  cn,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'
import { WebsiteSourceChoice, WebsiteSourceChoiceGrid } from '../WebsiteSourceChoice'

type StyleSource = 'library' | 'custom'

export function ThemeStyleLibraryChoice({
  ariaLabel,
  libraryTitle,
  libraryHint,
  customTitle,
  customHint,
  choice,
  onChoice,
}: {
  ariaLabel: string
  libraryTitle: string
  libraryHint: string
  customTitle: string
  customHint: string
  choice: StyleSource | null
  onChoice: (value: StyleSource) => void
}) {
  return (
    <WebsiteSourceChoiceGrid ariaLabel={ariaLabel}>
      <WebsiteSourceChoice
        selected={choice === 'library'}
        icon={<Library className="h-5 w-5 text-foreground" aria-hidden />}
        title={libraryTitle}
        hint={libraryHint}
        onClick={() => onChoice('library')}
      />
      <WebsiteSourceChoice
        selected={choice === 'custom'}
        icon={<Plus className="h-5 w-5 text-foreground" aria-hidden />}
        title={customTitle}
        hint={customHint}
        onClick={() => onChoice('custom')}
      />
    </WebsiteSourceChoiceGrid>
  )
}

export function ThemeStyleLibraryList<T extends { id: string }>({
  hint,
  fieldError,
  listStatus,
  listError,
  items,
  selectedId,
  onSelect,
  emptyLabel,
  renderItem,
}: {
  hint: string
  fieldError?: string
  listStatus: 'idle' | 'loading' | 'succeeded' | 'error'
  listError: string | null
  items: T[]
  selectedId: string | null
  onSelect: (id: string) => void
  emptyLabel: string
  renderItem: (item: T, selected: boolean) => ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{hint}</p>
      {fieldError ? (
        <p className="text-sm text-destructive" role="alert">{fieldError}</p>
      ) : null}
      {listStatus === 'error' ? (
        <p className="text-sm text-destructive" role="alert">{listError}</p>
      ) : null}
      {listStatus === 'loading' && items.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner aria-hidden />
        </div>
      ) : items.length === 0 ? (
        <ItemListEmpty>{emptyLabel}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((item) => {
            const selected = item.id === selectedId
            return (
              <ItemListItem key={item.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    selected && itemListRowActiveClassName,
                  )}
                  onClick={() => onSelect(item.id)}
                >
                  <ItemListContent>{renderItem(item, selected)}</ItemListContent>
                </button>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </div>
  )
}
