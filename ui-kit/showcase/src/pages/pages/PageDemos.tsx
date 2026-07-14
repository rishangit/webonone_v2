import { useMemo, useState } from 'react'
import { z } from 'zod'
import {
  Button,
  Checkbox,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FeaturePage,
  Form,
  FormField,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListRowActiveClassName,
  Label,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  ListSearchField,
  mapZodIssuesToFieldErrors,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@webonone/ui-kit'

type MockItem = {
  id: string
  name: string
  status: 'active' | 'archived'
}

const MOCK_ITEMS: MockItem[] = Array.from({ length: 36 }, (_, index) => ({
  id: String(index + 1),
  name: `Catalog item ${index + 1}`,
  status: index % 5 === 0 ? 'archived' : 'active',
}))

export function ListPageDemo() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>('1')

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return MOCK_ITEMS.filter((item) => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false
      if (!query) return true
      return item.name.toLowerCase().includes(query)
    })
  }, [filterStatus, searchQuery])

  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)
  const hasActiveFilters = filterStatus !== 'all'

  return (
    <FeaturePage
      title="List page"
      description="Production list composition: FeaturePage actions, ListFilterPanel, ListPageBody, ItemList, and Pagination."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ListSearchField
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value)
              setPage(1)
            }}
            placeholder="Item name"
            onClear={() => setPage(1)}
            aria-label="Search catalog items"
          />
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          <Button type="button" size="sm">
            Add item
          </Button>
        </div>
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={() => setPage(1)}
        onClear={() => {
          setFilterStatus('all')
          setPage(1)
        }}
      >
        <FormField label="Status" htmlFor="pages-list-filter-status">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger id="pages-list-filter-status">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      <ListPageBody>
        <div className="flex-1">
          {visibleItems.length === 0 ? (
            <ItemListEmpty>No items match your search or filters.</ItemListEmpty>
          ) : (
            <ItemList>
              {visibleItems.map((item) => (
                <ItemListItem
                  key={item.id}
                  className={selectedId === item.id ? itemListRowActiveClassName : undefined}
                  onClick={() => setSelectedId(item.id)}
                >
                  <ItemListContent>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
                  </ItemListContent>
                  <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(item.id)
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </ItemListMenu>
                </ItemListItem>
              ))}
            </ItemList>
          )}
        </div>
        <Pagination
          className="mt-auto"
          totalCount={filteredItems.length}
          currentPage={page}
          pageSize={pageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPage(1)
          }}
        />
      </ListPageBody>
    </FeaturePage>
  )
}

const detailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.string().min(1, 'Select a status'),
  description: z.string().optional(),
})

type DetailsValues = z.infer<typeof detailsSchema>

export function DetailsPageDemo() {
  const [values, setValues] = useState<DetailsValues>({
    name: 'Catalog item 1',
    status: 'active',
    description: 'Editor/details template for service feature pages.',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof DetailsValues, string>>>({})
  const [notify, setNotify] = useState(true)
  const [featured, setFeatured] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = detailsSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setErrors({})
  }

  return (
    <FeaturePage
      title="Details page"
      description="Editor/details composition: FeaturePage + FormField controls with inline validation."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" form="pages-details-form">
            Save
          </Button>
        </div>
      }
    >
      <Form id="pages-details-form" onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FormField label="Name" htmlFor="pages-details-name" required error={errors.name}>
          <Input
            id="pages-details-name"
            value={values.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValues((v) => ({ ...v, name: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Status" htmlFor="pages-details-status" required error={errors.status}>
          <Select
            value={values.status}
            onValueChange={(status: string) => setValues((v) => ({ ...v, status }))}
          >
            <SelectTrigger id="pages-details-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Description" htmlFor="pages-details-description" error={errors.description}>
          <Textarea
            id="pages-details-description"
            rows={4}
            value={values.description ?? ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setValues((v) => ({ ...v, description: e.target.value }))
            }
          />
        </FormField>
        <div className="flex items-center gap-2">
          <Switch id="pages-details-notify" checked={notify} onCheckedChange={setNotify} />
          <Label htmlFor="pages-details-notify">Send notifications on save</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="pages-details-featured"
            checked={featured}
            onCheckedChange={(v: boolean | 'indeterminate') => setFeatured(v === true)}
          />
          <Label htmlFor="pages-details-featured">Featured item</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: clear the Name field and click Save to see an inline field error.
        </p>
      </Form>
    </FeaturePage>
  )
}
