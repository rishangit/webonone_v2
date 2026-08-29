import { useMemo, useState } from 'react'
import { z } from 'zod'
import { Home, Image, MessageCircle, MoreVertical, Palette, Settings, ClipboardPaste } from 'lucide-react'
import { formatPickerDateTime } from '../../../package/src/lib/displayDateFormat'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppEndPanel,
  AppHeader,
  AppShell,
  AuthLayout,
  Avatar,
  AvatarGroup,
  Button,
  Callout,
  CalloutAction,
  CalloutDescription,
  CalloutTitle,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Form,
  FormField,
  FeaturePage,
  FullCalendar,
  ImagePreview,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListRowActiveClassName,
  ConfirmItemList,
  Label,
  ListFilterPanel,
  ListFilterTrigger,
  ListAddButton,
  LoadingState,
  Pagination,
  mapZodIssuesToFieldErrors,
  PageShell,
  PasswordInput,
  SearchInput,
  shapeCardAreaClassName,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Switch,
  Textarea,
  useToast,
  type ConfirmListItem,
  type FullCalendarEvent,
  type FullCalendarView,
  type NavConfigItem,
  type ImagePreviewMode,
} from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

const showcaseNav: NavConfigItem[] = [
  { type: 'item', to: '#home', label: 'Home', icon: Home },
  { type: 'item', to: '#media', label: 'Media demo', icon: Image },
  {
    type: 'group',
    label: 'Settings',
    icon: Settings,
    children: [{ to: '#theme', label: 'System Theme', icon: Palette }],
  },
]

const formSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.string().min(1, 'Select a role'),
})

type FormValues = z.infer<typeof formSchema>

function FormsDemo() {
  const [values, setValues] = useState<FormValues>({ email: '', password: '', role: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [marketing, setMarketing] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = formSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setErrors({})
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Registration form</CardTitle>
        <CardDescription>Uses new 1.3.0 controls with Zod validation</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          <FormField label="Email" htmlFor="reg-email" required error={errors.email}>
            <Input
              id="reg-email"
              type="email"
              value={values.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Password" htmlFor="reg-password" required error={errors.password}>
            <PasswordInput
              id="reg-password"
              value={values.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, password: e.target.value }))}
            />
          </FormField>
          <FormField label="Role" htmlFor="reg-role" required error={errors.role}>
            <Select value={values.role} onValueChange={(role: string) => setValues((v) => ({ ...v, role }))}>
              <SelectTrigger id="reg-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex items-center gap-2">
            <Switch id="marketing" checked={marketing} onCheckedChange={setMarketing} />
            <Label htmlFor="marketing">Marketing emails</Label>
          </div>
          <FormField label="Bio" htmlFor="reg-bio">
            <Textarea id="reg-bio" placeholder="Optional bio" rows={3} />
          </FormField>
          <Button type="submit">Validate</Button>
        </Form>
      </CardContent>
    </Card>
  )
}

const demoAvatarUsers = [
  { src: 'https://i.pravatar.cc/150?img=11', fallback: 'AM', alt: 'Alex Morgan', name: 'Alex Morgan' },
  { src: 'https://i.pravatar.cc/150?img=5', fallback: 'JD', alt: 'Jane Doe', name: 'Jane Doe' },
  { src: 'https://i.pravatar.cc/150?img=12', fallback: 'SK', alt: 'Sam Kim', name: 'Sam Kim' },
  { src: 'https://i.pravatar.cc/150?img=32', fallback: 'RW', alt: 'Riley Wong', name: 'Riley Wong' },
  { src: 'https://i.pravatar.cc/150?img=8', fallback: 'TC', alt: 'Taylor Chen', name: 'Taylor Chen' },
  { src: 'https://i.pravatar.cc/150?img=15', fallback: 'MJ', alt: 'Morgan Jones', name: 'Morgan Jones' },
  { src: 'https://i.pravatar.cc/150?img=20', fallback: 'LP', alt: 'Lee Park', name: 'Lee Park' },
] as const

function DropdownMenuDemo() {
  const [showStatus, setShowStatus] = useState(true)
  const [sort, setSort] = useState('name')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open menu">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          Edit
          <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Export</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
          Show status
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="name">Sort by name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">Sort by date</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ImagePreviewDemo({ onEdit }: { onEdit: () => void }) {
  const [mode, setMode] = useState<ImagePreviewMode>('view')
  const sampleSrc = demoAvatarUsers[0].src

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-8">
        <div className="space-y-2">
          <p className="text-sm font-medium">With image</p>
          <ImagePreview
            src={sampleSrc}
            alt="Sample preview"
            fallback="SP"
            mode={mode}
            onEdit={mode === 'edit' ? onEdit : undefined}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Without image (first upload)</p>
          <ImagePreview
            src={null}
            alt="Empty preview"
            mode={mode}
            onEdit={mode === 'edit' ? onEdit : undefined}
          />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Fixed <code className="text-xs">w-40 h-40</code> preview. Empty state shows a centered image
          icon. In edit mode the pencil button opens the Media selector in consuming apps via{' '}
          <code className="text-xs">onEdit</code>.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setMode((m) => (m === 'view' ? 'edit' : 'view'))}
        >
          Switch to {mode === 'view' ? 'edit' : 'view'} mode
        </Button>
      </div>
    </div>
  )
}

function LoadingStateDemo() {
  const [overlayOpen, setOverlayOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border py-8">
        <LoadingState label="Loading tags…" />
      </div>
      <p className="text-xs text-muted-foreground">
        Inline <code className="text-xs">LoadingState</code> — themed spinner and label (default for list
        sections).
      </p>
      <Button type="button" variant="outline" onClick={() => setOverlayOpen(true)}>
        Show loading overlay
      </Button>
      <p className="text-xs text-muted-foreground">
        Overlay mode uses <code className="text-xs">overlay</code> for page, route, and session loads.
      </p>
      {overlayOpen ? (
        <LoadingState overlay label="Loading…" />
      ) : null}
      {overlayOpen ? (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center">
          <Button type="button" onClick={() => setOverlayOpen(false)}>
            Dismiss overlay
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ConfirmItemListDemo() {
  const [items, setItems] = useState<ConfirmListItem[]>([
    {
      id: '1',
      status: 'pending_confirmation',
      record: {
        Name: 'Dental Checkup and Cleaning',
        'Time mode': 'duration',
        'Duration (minutes)': '—',
        Status: 'pending',
      },
      displayFields: [
        { key: 'name', label: 'Name', value: 'Dental Checkup and Cleaning', missing: false, editable: false, inputType: 'text' },
        { key: 'time_mode', label: 'Time mode', value: 'duration', missing: false, editable: false, inputType: 'text' },
        { key: 'duration_minutes', label: 'Duration (minutes)', value: '—', missing: true, editable: true, inputType: 'number' },
        { key: 'status', label: 'Status', value: 'pending', missing: false, editable: false, inputType: 'text' },
      ],
      confirmedLabel: 'Dental Checkup and Cleaning added',
      canceledLabel: 'Dental Checkup and Cleaning canceled',
    },
    {
      id: '2',
      status: 'pending_confirmation',
      record: { name: 'Pediatrics', description: 'Care for infants and children.' },
      confirmedLabel: 'Pediatrics added',
      canceledLabel: 'Pediatrics canceled',
    },
  ])

  return (
    <ConfirmItemList
      items={items}
      pendingHint="Confirm each new item to apply it."
      confirmLabel="Confirm"
      skipLabel="Skip"
      onConfirm={(id) =>
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, status: 'confirmed' } : item)),
        )
      }
      onSkip={(id) =>
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item)),
        )
      }
    />
  )
}

function FullCalendarDemo() {
  const [view, setView] = useState<FullCalendarView>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [selection, setSelection] = useState<string | null>(null)

  const sampleEvents = useMemo((): FullCalendarEvent[] => {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()
    const d = today.getDate()
    return [
      {
        id: '1',
        title: 'Team standup',
        start: new Date(y, m, d, 9, 0),
        end: new Date(y, m, d, 9, 30),
      },
      {
        id: '2',
        title: 'Design review',
        start: new Date(y, m, d, 11, 0),
        end: new Date(y, m, d, 12, 0),
      },
      {
        id: '3',
        title: 'Client workshop',
        start: new Date(y, m, d, 14, 0),
        end: new Date(y, m, d, 16, 0),
        subtitle: 'Staff on leave',
        issueDetail:
          'Assigned staff is on approved leave for this session. Cancel or reassign staff.',
      },
      {
        id: '4',
        title: 'Sprint planning',
        start: new Date(y, m, d + 1, 10, 0),
        end: new Date(y, m, d + 1, 12, 0),
      },
      {
        id: '5',
        title: 'Offsite (multi-day)',
        start: new Date(y, m, d + 2, 9, 0),
        end: new Date(y, m, d + 4, 17, 0),
      },
      {
        id: '6',
        title: 'One-on-one',
        start: new Date(y, m, d + 3, 15, 0),
        end: new Date(y, m, d + 3, 15, 45),
        subtitle: 'Cancelled',
        issueDetail: 'This session is cancelled and is hidden from customers.',
      },
    ]
  }, [])

  return (
    <div className="space-y-3">
      <FullCalendar
        view={view}
        onViewChange={setView}
        anchorDate={anchorDate}
        onAnchorDateChange={setAnchorDate}
        events={sampleEvents}
        onSlotClick={(range) =>
          setSelection(`Slot ${formatPickerDateTime(range.start)} – ${formatPickerDateTime(range.end)}`)
        }
        onEventClick={(event) => setSelection(`Event: ${event.title}`)}
      />
      {selection ? (
        <p className="text-sm text-muted-foreground">Selected: {selection}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Click a slot or event to preview selection.</p>
      )}
    </div>
  )
}

function AppShellDemo() {
  const [endPanelOpen, setEndPanelOpen] = useState(true)

  return (
    <AppShell
      className="h-[28rem]"
      lockDocumentScroll={false}
      nav={showcaseNav}
      activePath="#home"
      user={{
        displayName: 'Demo User',
        email: 'demo@example.com',
        role: 'company_admin',
      }}
      sidebarSession={{
        title: 'Acme Corp',
        role: 'company_admin',
        imageUrl: 'https://placehold.co/72x72/1e293b/f8fafc/png?text=AC',
      }}
      headerActions={
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Open assistant"
          aria-pressed={endPanelOpen}
          onClick={() => setEndPanelOpen((open) => !open)}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      }
      aside={
        endPanelOpen ? (
          <AppEndPanel title="Assistant" onClose={() => setEndPanelOpen(false)}>
            <p className="text-sm text-muted-foreground">
              Overlays the page on small screens; sits beside main content from md up.
            </p>
          </AppEndPanel>
        ) : null
      }
    >
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="mt-2 text-muted-foreground">Main content area.</p>
    </AppShell>
  )
}

export function ComponentsPage() {
  const { toast } = useToast()
  const [listPage, setListPage] = useState(1)
  const [listPageSize, setListPageSize] = useState(12)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const demoListItems = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: String(index + 1),
        name: `Theme palette ${index + 1}`,
        active: index === 0,
      })),
    [],
  )
  const visibleListItems = demoListItems
    .filter((theme) => filterStatus === 'all' || theme.active)
    .filter((theme) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      return theme.name.toLowerCase().includes(query)
    })
    .slice((listPage - 1) * listPageSize, listPage * listPageSize)
  const hasActiveFilters = filterStatus !== 'all'

  return (
    <>
      <DemoSection id="forms" title="Forms">
        <FormsDemo />
      </DemoSection>

      <DemoSection id="feedback" title="Feedback">
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>This is a default alert message.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong.</AlertDescription>
          </Alert>
        </div>
      </DemoSection>

      <DemoSection
        id="callout"
        title="Callout"
        description="Highlighted panel for optional actions — import shortcuts, tips, or secondary flows."
      >
        <div className="max-w-lg space-y-4">
          <Callout>
            <CalloutTitle>Import from CColorPalette</CalloutTitle>
            <CalloutDescription>
              On{' '}
              <a
                href="https://ccolorpalette.com/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                CColorPalette
              </a>
              , choose a palette → <span className="font-medium text-foreground">Export</span> →{' '}
              <span className="font-medium text-foreground">CSS variables</span>, then paste the{' '}
              <code className="rounded bg-background/80 px-1 py-0.5 text-xs">:root {'{ … }'}</code>{' '}
              block to fill all five theme colors at once.
            </CalloutDescription>
            <CalloutAction>
              <Button type="button" className="h-10">
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Paste CSS from CColorPalette
              </Button>
            </CalloutAction>
          </Callout>
          <Callout variant="muted">
            <CalloutTitle>Muted callout</CalloutTitle>
            <CalloutDescription>
              Use <code className="text-xs">variant=&quot;muted&quot;</code> for lower-emphasis tips
              without the primary tint.
            </CalloutDescription>
          </Callout>
        </div>
      </DemoSection>

      <DemoSection id="loadings" title="Loadings">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
          <p className="text-xs text-muted-foreground">
            Inline sizes above — use <code className="text-xs">size="sm"</code> inside buttons only.
          </p>
          <LoadingStateDemo />
          <ItemListEmpty>No tags found.</ItemListEmpty>
          <ItemListEmpty>No templates found for your scope.</ItemListEmpty>
        </div>
      </DemoSection>

      <DemoSection id="toast" title="Toast">
        <Button variant="outline" onClick={() => toast({ title: 'Toast', description: 'Notification sent' })}>
          Show toast
        </Button>
      </DemoSection>

      <DemoSection id="three-dot-menu" title="3-dot menu">
        <DropdownMenuDemo />
      </DemoSection>

      <DemoSection
        id="item-lists"
        title="Item lists"
        description="Small gap between rows, glass-card surfaces, themed shadow on hover, per-row 3-dot menus."
      >
        <ItemList>
          {[
            { id: '1', name: 'Default theme', active: true },
            { id: '2', name: 'Ocean palette', active: false },
            { id: '3', name: 'Sunset palette', active: false },
          ].map((theme) => (
            <ItemListItem
              key={theme.id}
              className={theme.active ? itemListRowActiveClassName : undefined}
            >
              <ItemListContent>
                <p className="font-medium">{theme.name}</p>
                <p className="text-xs text-muted-foreground">
                  {theme.active ? 'Currently applied' : 'Click menu to apply'}
                </p>
              </ItemListContent>
              <ItemListMenu ariaLabel={`Actions for ${theme.name}`}>
                <DropdownMenuItem>{theme.active ? 'Active' : 'Apply'}</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Delete
                </DropdownMenuItem>
              </ItemListMenu>
            </ItemListItem>
          ))}
        </ItemList>
        <div className="mt-4">
          <ItemListEmpty>No items to show.</ItemListEmpty>
        </div>
      </DemoSection>

      <DemoSection
        id="confirm-item-list"
        title="Confirm item list"
        description="Pending addable records with Confirm and Skip links. Used by the WebOnOne assistant."
      >
        <ConfirmItemListDemo />
      </DemoSection>

      <DemoSection
        id="list-filters"
        title="List filters"
        description="SearchInput filters the list; ListFilterTrigger opens the panel; ListAddButton stays compact (+ Add) on small screens until tapped."
      >
        <FeaturePage
          title="Filtered collection"
          description="Demo list with search and filter panel."
          actions={
            <div className="flex items-center gap-2">
              <SearchInput
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setListPage(1)
                }}
                placeholder="Theme name"
                onClear={() => setListPage(1)}
                aria-label="Search themes"
                className="w-64"
              />
              <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
              <ListAddButton>Add theme</ListAddButton>
            </div>
          }
        >
          <ListFilterPanel
            open={filterOpen}
            onOpenChange={setFilterOpen}
            onApply={() => setListPage(1)}
            onClear={() => {
              setFilterStatus('all')
              setListPage(1)
            }}
          >
            <FormField label="Status" htmlFor="demo-filter-status">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="demo-filter-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </ListFilterPanel>

          <ItemList>
            {visibleListItems.map((theme) => (
                <ItemListItem
                  key={theme.id}
                  className={theme.active ? itemListRowActiveClassName : undefined}
                >
                  <ItemListContent>
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {theme.active ? 'Currently applied' : 'Filtered row'}
                    </p>
                  </ItemListContent>
                </ItemListItem>
              ))}
          </ItemList>
        </FeaturePage>
      </DemoSection>

      <DemoSection
        id="pagination"
        title="Pagination"
        description="Pager primitive. Collection pages use ListPageFooter (pagination or on-scroll) instead of this component directly."
      >
        <div className="space-y-4">
          <ItemList>
            {visibleListItems.map((theme) => (
              <ItemListItem
                key={theme.id}
                className={theme.active ? itemListRowActiveClassName : undefined}
              >
                <ItemListContent>
                  <p className="font-medium">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {theme.active ? 'Currently applied' : 'Paginated row'}
                  </p>
                </ItemListContent>
                <ItemListMenu ariaLabel={`Actions for ${theme.name}`}>
                  <DropdownMenuItem>View</DropdownMenuItem>
                </ItemListMenu>
              </ItemListItem>
            ))}
          </ItemList>
          <Pagination
            totalCount={demoListItems.length}
            currentPage={listPage}
            pageSize={listPageSize}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={setListPage}
            onPageSizeChange={(nextSize) => {
              setListPageSize(nextSize)
              setListPage(1)
            }}
          />
        </div>
      </DemoSection>

      <DemoSection id="avatars" title="Avatars">
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Sizes (initials fallback)</p>
            <div className="flex flex-wrap items-end gap-4">
              <Avatar size="xs" fallback="JD" />
              <Avatar size="sm" fallback="JD" />
              <Avatar size="md" fallback="JD" />
              <Avatar size="lg" fallback="JD" />
              <Avatar size="xl" fallback="JD" />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted-foreground">With photos (theme border)</p>
            <div className="flex flex-wrap items-center gap-4">
              {demoAvatarUsers.map((user) => (
                <Avatar
                  key={user.alt}
                  size="lg"
                  src={user.src}
                  alt={user.alt}
                  fallback={user.fallback}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Group stack — hover to expand full list (+N when more than 4)
            </p>
            <AvatarGroup users={[...demoAvatarUsers]} size="md" max={4} />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        id="image-preview"
        title="Image preview"
        description="Fixed-size image with view/edit modes. Edit opens Media selector in consuming apps."
      >
        <ImagePreviewDemo
          onEdit={() =>
            toast({
              title: 'Edit image',
              description: 'Consumer would open Media selector dialog here.',
            })
          }
        />
      </DemoSection>

      <DemoSection id="app-header" title="App header">
        <div className="space-y-4 overflow-hidden rounded-lg border">
          <AppHeader />
          <AppHeader
            locale="en"
            onLocaleChange={(next) => toast({ title: `Language: ${next}` })}
            labels={{ language: 'Language', english: 'English', sinhala: 'සිංහල' }}
          />
          <AppHeader
            user={{
              displayName: 'Jane Doe',
              email: 'jane@example.com',
              avatarUrl: demoAvatarUsers[1].src,
              role: 'company_admin',
            }}
            locale="en"
            onLocaleChange={(next) => toast({ title: `Language: ${next}` })}
            onProfileClick={() => toast({ title: 'Open profile' })}
            onLogout={() => toast({ title: 'Logged out' })}
          />
        </div>
      </DemoSection>

      <DemoSection id="app-shell" title="App shell">
        <div className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            Narrow container simulates mobile; resize viewport for hamburger vs fixed sidebar.
          </div>
          <AppShellDemo />
        </div>
      </DemoSection>

      <DemoSection
        id="theming"
        title="Theming"
        description="Use the sticky theme toolbar above to toggle light/dark and accent palettes."
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Scrollbar demo</CardTitle>
            <CardDescription>Scrollable panel uses scrollbar-themed utility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-themed h-32 overflow-y-auto rounded-md border p-3 text-sm">
              {Array.from({ length: 12 }, (_, i) => (
                <p key={i} className="py-1 text-muted-foreground">
                  Scroll line {i + 1}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </DemoSection>

      <DemoSection
        id="layout"
        title="Layout"
        description="FeaturePage — full-width column with PageHeader title block and gap-3 between header and body."
      >
        <div className="space-y-8 rounded-lg border bg-muted/20 p-4">
          <FeaturePage
            title="Default feature page"
            description="Full-width layout with consistent header spacing."
          >
            <Card>
              <CardContent className="pt-6">Page body content sits below the header with gap-3.</CardContent>
            </Card>
          </FeaturePage>
          <FeaturePage
            title="Page with actions"
            description="Header actions align to the end on sm+ viewports."
            actions={
              <Button type="button" size="sm">
                Create item
              </Button>
            }
          >
            <Card>
              <CardContent className="pt-6">Primary actions live in the PageHeader actions slot.</CardContent>
            </Card>
          </FeaturePage>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>PageShell</CardTitle>
              <CardDescription>Full-width layout wrapper for standalone service pages</CardDescription>
            </CardHeader>
            <CardContent>
              <PageShell title="Example">Content area</PageShell>
            </CardContent>
          </Card>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">AuthLayout (minimal)</p>
            <AuthLayout title="Sign in" description="Minimal embed variant" variant="minimal">
              <Button className="w-full">Sign in</Button>
            </AuthLayout>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        id="full-calendar"
        title="Full calendar"
        description="Day / week / month board for scheduling pages. Compact Calendar remains for DatePicker only."
      >
        <FullCalendarDemo />
      </DemoSection>

      <DemoSection
        id="cards"
        title="Cards"
        description="Sibling cards auto-alternate theme primary and secondary colors."
      >
        <div className={`${shapeCardAreaClassName} grid gap-4 md:grid-cols-2`}>
          <Card>
            <CardHeader>
              <CardTitle>First card</CardTitle>
              <CardDescription>Theme primary</CardDescription>
            </CardHeader>
            <CardContent>Card body content.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Second card</CardTitle>
              <CardDescription>Theme secondary</CardDescription>
            </CardHeader>
            <CardContent>Stat or detail content.</CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Third card</CardTitle>
              <CardDescription>Theme primary again</CardDescription>
            </CardHeader>
            <CardContent>Alternates by sibling order.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fourth card</CardTitle>
              <CardDescription>Theme secondary again</CardDescription>
            </CardHeader>
            <CardContent>No tone prop required.</CardContent>
          </Card>
        </div>
      </DemoSection>
    </>
  )
}
