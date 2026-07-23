import { useMemo, useState } from 'react'
import { ArrowLeft, Edit3, Globe, Mail, MapPin, Phone, Plus, User } from 'lucide-react'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FeaturePage,
  Form,
  FormField,
  Input,
  ImagePreview,
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
  SearchInput,
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
          <SearchInput
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Item name"
            onClear={() => setPage(1)}
            aria-label="Search catalog items"
            className="w-64"
          />
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          <Button type="button" size="sm">
            <Plus className="h-4 w-4" aria-hidden />
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

const profileDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Enter a valid email'),
  phoneNumber: z.string().optional(),
  locale: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
})

type ProfileDetailsValues = z.infer<typeof profileDetailsSchema>

const INITIAL_PROFILE_DETAILS: ProfileDetailsValues = {
  firstName: 'Alex',
  lastName: 'Morgan',
  displayName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phoneNumber: '+1 555 0100',
  locale: 'en-US',
  addressLine1: '120 Platform Avenue',
  city: 'San Francisco',
  country: 'US',
  bio: 'Profile details page pattern with view and edit modes.',
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value?: string | null
  icon?: typeof User
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
        <span>{value?.trim() ? value : '—'}</span>
      </div>
    </div>
  )
}

export function DetailsPageDemo({ onBack }: { onBack?: () => void }) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [savedValues, setSavedValues] = useState<ProfileDetailsValues>(INITIAL_PROFILE_DETAILS)
  const [values, setValues] = useState<ProfileDetailsValues>(INITIAL_PROFILE_DETAILS)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileDetailsValues, string>>>({})
  const [notify, setNotify] = useState(true)
  const [featured, setFeatured] = useState(false)

  function handleCancelEdit() {
    setValues(savedValues)
    setErrors({})
    setMode('view')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = profileDetailsSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setErrors({})
    setSavedValues(parsed.data)
    setMode('view')
  }

  return (
    <FeaturePage
      title="Details page"
      description="Profile-style details composition with view mode and edit mode."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          {mode === 'view' ? (
            <Button type="button" size="sm" onClick={() => setMode('edit')}>
              <Edit3 className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" size="sm" form="pages-details-form">
                Save
              </Button>
            </>
          )}
        </div>
      }
    >
      {mode === 'view' ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Identity and short bio for this account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                  <ImagePreview src={null} alt={savedValues.displayName} mode="view" className="rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="text-xl font-semibold">{savedValues.displayName}</h2>
                    <p className="text-sm text-muted-foreground">{savedValues.email}</p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
                      <span>Email verified</span>
                      <span>Platform profile</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{savedValues.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address</CardTitle>
                <CardDescription>Postal / street address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label="Address line 1" value={savedValues.addressLine1} icon={MapPin} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="City" value={savedValues.city} icon={MapPin} />
                  <ReadOnlyField label="Country" value={savedValues.country} icon={Globe} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
                <CardDescription>How others can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label="Email" value={savedValues.email} icon={Mail} />
                <ReadOnlyField label="Phone number" value={savedValues.phoneNumber} icon={Phone} />
                <ReadOnlyField label="Locale" value={savedValues.locale} icon={Globe} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Name</CardTitle>
                <CardDescription>Legal and display names</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="First name" value={savedValues.firstName} icon={User} />
                  <ReadOnlyField label="Last name" value={savedValues.lastName} icon={User} />
                </div>
                <ReadOnlyField label="Display name" value={savedValues.displayName} icon={User} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Form
          id="pages-details-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 items-start gap-6 space-y-0 lg:grid-cols-3"
        >
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Identity and short bio for this account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Bio" htmlFor="pages-details-bio" error={errors.bio}>
                  <Textarea
                    rows={4}
                    value={values.bio ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setValues((v) => ({ ...v, bio: e.target.value }))
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
                  Tip: clear Display name or Email and click Save profile to see inline field errors.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address</CardTitle>
                <CardDescription>Postal / street address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Address line 1" htmlFor="pages-details-address" error={errors.addressLine1}>
                  <Input
                    value={values.addressLine1 ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValues((v) => ({ ...v, addressLine1: e.target.value }))
                    }
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="City" htmlFor="pages-details-city" error={errors.city}>
                    <Input
                      value={values.city ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setValues((v) => ({ ...v, city: e.target.value }))
                      }
                    />
                  </FormField>
                  <FormField label="Country" htmlFor="pages-details-country" error={errors.country}>
                    <Input
                      maxLength={2}
                      value={values.country ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setValues((v) => ({ ...v, country: e.target.value.toUpperCase() }))
                      }
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
                <CardDescription>How others can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Email" htmlFor="pages-details-email" required error={errors.email}>
                  <Input
                    type="email"
                    value={values.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValues((v) => ({ ...v, email: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Phone number" htmlFor="pages-details-phone" error={errors.phoneNumber}>
                  <Input
                    value={values.phoneNumber ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValues((v) => ({ ...v, phoneNumber: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Locale" htmlFor="pages-details-locale" error={errors.locale}>
                  <Select
                    value={values.locale ?? 'en-US'}
                    onValueChange={(locale: string) => setValues((v) => ({ ...v, locale }))}
                  >
                    <SelectTrigger id="pages-details-locale">
                      <SelectValue placeholder="Select locale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Name</CardTitle>
                <CardDescription>Legal and display names</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="First name"
                    htmlFor="pages-details-first-name"
                    required
                    error={errors.firstName}
                  >
                    <Input
                      value={values.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setValues((v) => ({ ...v, firstName: e.target.value }))
                      }
                    />
                  </FormField>
                  <FormField
                    label="Last name"
                    htmlFor="pages-details-last-name"
                    required
                    error={errors.lastName}
                  >
                    <Input
                      value={values.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setValues((v) => ({ ...v, lastName: e.target.value }))
                      }
                    />
                  </FormField>
                </div>
                <FormField
                  label="Display name"
                  htmlFor="pages-details-display-name"
                  required
                  error={errors.displayName}
                >
                  <Input
                    value={values.displayName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValues((v) => ({ ...v, displayName: e.target.value }))
                    }
                  />
                </FormField>
              </CardContent>
            </Card>
          </div>
        </Form>
      )}
    </FeaturePage>
  )
}
