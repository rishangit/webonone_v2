import { Fragment, useMemo } from 'react'
import { CollectionListView, ItemListEmpty } from '@webonone/ui-kit'
import type { AppListShowcaseEntry } from '@/pages/pages/appListShowcaseEntries'
import { AppListShowcaseCard } from '@/pages/pages/appListShowcaseCard'
import {
  AppListShowcaseRow,
  AppListShowcaseSourceLabel,
  ShowcaseStandardMenu,
} from '@/pages/pages/listItemShowcase'

function ShowcaseGridMenu({ entry }: { entry: AppListShowcaseEntry }) {
  return <ShowcaseStandardMenu name={entry.source} />
}

export interface AppListShowcaseCollectionViewProps {
  entries: AppListShowcaseEntry[]
  pickerSelectedId: string | null
  onPickerSelect: (id: string) => void
  onDetailOpen: (label: string) => void
}

export function AppListShowcaseCollectionView({
  entries,
  pickerSelectedId,
  onPickerSelect,
  onDetailOpen,
}: AppListShowcaseCollectionViewProps) {
  const columns = useMemo(
    () => [
      {
        id: 'source',
        header: 'Screen',
        sortable: true,
        compare: (a: AppListShowcaseEntry, b: AppListShowcaseEntry) =>
          a.source.localeCompare(b.source, undefined, { sensitivity: 'base' }),
        cell: (item: AppListShowcaseEntry) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onDetailOpen(item.source)}
          >
            {item.source}
          </button>
        ),
      },
      {
        id: 'service',
        header: 'Service',
        sortable: true,
        compare: (a: AppListShowcaseEntry, b: AppListShowcaseEntry) =>
          a.service.localeCompare(b.service, undefined, { sensitivity: 'base' }),
        cell: (item: AppListShowcaseEntry) => (
          <span className="capitalize text-muted-foreground">{item.service}</span>
        ),
      },
      {
        id: 'variant',
        header: 'Row pattern',
        sortable: true,
        compare: (a: AppListShowcaseEntry, b: AppListShowcaseEntry) =>
          a.variant.localeCompare(b.variant, undefined, { sensitivity: 'base' }),
        cell: (item: AppListShowcaseEntry) => (
          <span className="font-mono text-xs text-muted-foreground">{item.variant}</span>
        ),
      },
      {
        id: 'component',
        header: 'Component',
        cell: (item: AppListShowcaseEntry) => (
          <span className="font-mono text-[10px] text-muted-foreground">{item.component}</span>
        ),
      },
    ],
    [onDetailOpen],
  )

  return (
    <CollectionListView
      items={entries}
      getRowKey={(item) => item.id}
      columns={columns}
      empty={<ItemListEmpty>No items match your search or filters.</ItemListEmpty>}
      renderGridActions={(item) => <ShowcaseGridMenu entry={item} />}
      renderListItem={(entry) => (
        <Fragment key={entry.id}>
          <AppListShowcaseSourceLabel entry={entry} />
          <AppListShowcaseRow
            entry={entry}
            pickerSelectedId={pickerSelectedId}
            onPickerSelect={onPickerSelect}
            onDetailOpen={onDetailOpen}
          />
        </Fragment>
      )}
      renderCard={(entry) => (
        <AppListShowcaseCard entry={entry} onDetailOpen={onDetailOpen} />
      )}
    />
  )
}
