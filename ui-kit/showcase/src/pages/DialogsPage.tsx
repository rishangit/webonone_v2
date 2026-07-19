import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { Save, Tag, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Checkbox,
  CustomDialog,
  Form,
  FormField,
  Input,
  Label,
  mapZodIssuesToFieldErrors,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type DialogSizePreset,
  type LoadUsersFn,
  type UserOption,
  UserSelectionDialog,
} from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

const widthPresets: DialogSizePreset[] = ['small', 'medium', 'large', 'xlarge', 'auto']

const USER_ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'company_admin', label: 'Company admin' },
  { value: 'super_admin', label: 'Super admin' },
]

const MOCK_DIRECTORY_USERS: UserOption[] = Array.from({ length: 120 }, (_, index) => ({
  id: `mock-user-${index + 1}`,
  displayName: `Mock User ${index + 1}`,
  email: `mock.user${index + 1}@example.com`,
  role: USER_ROLE_OPTIONS[index % USER_ROLE_OPTIONS.length]!.value,
}))

async function mockLoadUsers(params: Parameters<LoadUsersFn>[0]) {
  await new Promise((resolve) => window.setTimeout(resolve, 400))

  let filtered = MOCK_DIRECTORY_USERS
  const query = params.search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    )
  }
  if (params.role) {
    filtered = filtered.filter((user) => user.role === params.role)
  }

  const start = (params.page - 1) * params.pageSize
  const users = filtered.slice(start, start + params.pageSize)

  return {
    users,
    hasMore: start + params.pageSize < filtered.length,
  }
}

const mockItems = [
  { id: '1', name: 'Summer' },
  { id: '2', name: 'Ocean' },
  { id: '3', name: 'Forest' },
]

const dialogFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.string().min(1, 'Select a role'),
})

function NestedDialogDemo() {
  const [outerOpen, setOuterOpen] = useState(false)
  const [innerOpen, setInnerOpen] = useState(false)
  const innerOpenRef = useRef(false)

  useEffect(() => {
    innerOpenRef.current = innerOpen
  }, [innerOpen])

  function handleOuterOpenChange(next: boolean) {
    if (!next && innerOpenRef.current) {
      innerOpenRef.current = false
      setInnerOpen(false)
      return
    }
    setOuterOpen(next)
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOuterOpen(true)}>
        Open outer dialog
      </Button>
      <CustomDialog
        open={outerOpen}
        onOpenChange={handleOuterOpenChange}
        title="Outer dialog"
        description="Open inner dialog from body — inner renders as a sibling, not nested in this body."
        sizeWidth="large"
        sizeHeight="medium"
        nestedDismissGuard={innerOpen}
        footer={
          <Button variant="outline" className="h-10 px-4" onClick={() => handleOuterOpenChange(false)}>
            Close outer
          </Button>
        }
      >
        <Button
          variant="outline"
          onClick={() => {
            innerOpenRef.current = true
            setInnerOpen(true)
          }}
        >
          Open inner dialog
        </Button>
      </CustomDialog>
      <CustomDialog
        open={innerOpen}
        onOpenChange={setInnerOpen}
        title="Inner dialog"
        description="Stacked above the outer dialog with its own overlay."
        sizeWidth="auto"
        maxWidth="max-w-sm"
        stackLevel={1}
        footer={
          <Button variant="outline" className="h-10 px-4" onClick={() => setInnerOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">Closing this keeps the outer dialog open.</p>
      </CustomDialog>
    </>
  )
}

export function DialogsPage() {
  const [widthDemoOpen, setWidthDemoOpen] = useState<DialogSizePreset | null>(null)
  const [scrollOpen, setScrollOpen] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<(typeof mockItems)[0] | null>(null)
  const [items, setItems] = useState(mockItems)
  const [alertOpen, setAlertOpen] = useState(false)
  const [formValues, setFormValues] = useState({ email: '', role: '' })
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({})
  const [terms, setTerms] = useState(false)
  const [userSelectOpen, setUserSelectOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)

  function openDelete(item: (typeof mockItems)[0]) {
    setDeleteTarget(item)
    setDeleteOpen(true)
  }

  function confirmDelete() {
    if (deleteTarget) {
      setItems((list) => list.filter((i) => i.id !== deleteTarget.id))
    }
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  function submitDialogForm() {
    const parsed = dialogFormSchema.safeParse(formValues)
    if (!parsed.success) {
      setFormErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFormErrors({})
    setFormOpen(false)
  }

  return (
    <>
      <DemoSection id="custom-dialog-width" title="CustomDialog — width presets">
        <div className="flex flex-wrap gap-2">
          {widthPresets.map((preset) => (
            <Button key={preset} variant="outline" onClick={() => setWidthDemoOpen(preset)}>
              {preset}
            </Button>
          ))}
        </div>
        <CustomDialog
          open={widthDemoOpen !== null}
          onOpenChange={(open: boolean) => !open && setWidthDemoOpen(null)}
          title={`Width: ${widthDemoOpen}`}
          description="Independent width and height presets."
          sizeWidth={widthDemoOpen ?? 'medium'}
          sizeHeight="medium"
          maxWidth={widthDemoOpen === 'auto' ? 'max-w-md' : 'max-w-lg'}
          footer={
            <>
              <Button variant="outline" className="h-10 px-4" onClick={() => setWidthDemoOpen(null)}>
                Cancel
              </Button>
              <Button className="h-10" onClick={() => setWidthDemoOpen(null)}>
                Confirm
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">Body for {widthDemoOpen} width preset.</p>
        </CustomDialog>
      </DemoSection>

      <DemoSection id="custom-dialog-scroll" title="CustomDialog — height + scroll">
        <Button variant="outline" onClick={() => setScrollOpen(true)}>
          Open narrow + tall dialog
        </Button>
        <CustomDialog
          open={scrollOpen}
          onOpenChange={setScrollOpen}
          title="Scrollable body"
          description="sizeWidth=small, sizeHeight=large"
          sizeWidth="small"
          sizeHeight="large"
          footer={
            <>
              <Button variant="outline" className="h-10 px-4" onClick={() => setScrollOpen(false)}>
                Cancel
              </Button>
              <Button className="h-10" onClick={() => setScrollOpen(false)}>
                Done
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            {Array.from({ length: 24 }, (_, i) => (
              <p key={i}>Scrollable line {i + 1}</p>
            ))}
          </div>
        </CustomDialog>
      </DemoSection>

      <DemoSection id="custom-dialog-combinations" title="CustomDialog — common combinations">
        <Button variant="outline" onClick={() => setComboOpen(true)}>
          Wizard (large × xlarge)
        </Button>
        <CustomDialog
          open={comboOpen}
          onOpenChange={setComboOpen}
          title="Multi-step wizard"
          description="sizeWidth=large, sizeHeight=xlarge"
          sizeWidth="large"
          sizeHeight="xlarge"
          footer={
            <>
              <Button variant="outline" className="h-10 px-4" onClick={() => setComboOpen(false)}>
                Previous
              </Button>
              <Button className="h-10" onClick={() => setComboOpen(false)}>
                Next
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">Wizard content area for selection or multi-step flows.</p>
        </CustomDialog>
      </DemoSection>

      <DemoSection id="custom-dialog-form" title="CustomDialog — form in dialog">
        <Button onClick={() => setFormOpen(true)}>Open form dialog</Button>
        <CustomDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Edit profile"
          description="Validate with Zod — errors inline in body."
          icon={<Tag className="h-5 w-5" />}
          sizeWidth="small"
          sizeHeight="large"
          footer={
            <>
              <Button variant="outline" className="h-10 px-4" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button className="h-10" onClick={submitDialogForm}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          }
        >
          <Form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault()
              submitDialogForm()
            }}
          >
            <FormField label="Email" htmlFor="dlg-email" required error={formErrors.email}>
              <Input
                id="dlg-email"
                type="email"
                value={formValues.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormValues((v) => ({ ...v, email: e.target.value }))}
              />
            </FormField>
            <FormField label="Role" htmlFor="dlg-role" required error={formErrors.role}>
              <Select
                value={formValues.role}
                onValueChange={(role: string) => setFormValues((v) => ({ ...v, role }))}
              >
                <SelectTrigger id="dlg-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-center gap-2">
              <Checkbox id="dlg-terms" checked={terms} onCheckedChange={(v: boolean | 'indeterminate') => setTerms(v === true)} />
              <Label htmlFor="dlg-terms">Subscribe to updates</Label>
            </div>
          </Form>
        </CustomDialog>
      </DemoSection>

      <DemoSection id="alert-dialog-delete" title="AlertDialog — delete confirmation">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>{item.name}</span>
              <Button variant="outline" size="sm" onClick={() => openDelete(item)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete item?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The item will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DemoSection>

      <DemoSection
        id="user-selection-dialog"
        title="UserSelectionDialog (local mock data) — search + infinite scroll"
      >
        <div className="space-y-3">
          <Button variant="outline" onClick={() => setUserSelectOpen(true)}>
            Open local-data user selection
          </Button>
          <p className="text-sm text-muted-foreground">
            Selected (mock):{' '}
            {selectedUser ? (
              <span className="text-foreground">
                {selectedUser.displayName} · {selectedUser.email}
              </span>
            ) : (
              '(none)'
            )}
          </p>
        </div>
        <UserSelectionDialog
          open={userSelectOpen}
          onOpenChange={setUserSelectOpen}
          onSelect={setSelectedUser}
          loadUsers={mockLoadUsers}
          roleOptions={USER_ROLE_OPTIONS}
          description="Scroll to load more users. Click a row to select."
        />
      </DemoSection>

      <DemoSection id="custom-dialog-nested" title="CustomDialog — stacked siblings">
        <NestedDialogDemo />
      </DemoSection>

      <DemoSection id="alert-dialog" title="AlertDialog — strict confirm">
        <div className="flex flex-wrap gap-2">
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Unsaved changes</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Continue without saving?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved changes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction>Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">AlertDialog delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  Overlay click and Escape will not dismiss this dialog.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DemoSection>

      <DemoSection
        id="dialog-theme"
        title="Theme sensitivity"
        description="Toggle the theme toolbar — reopen dialogs to see updated glass borders, gradients, and destructive colors."
      >
        <p className="text-sm text-muted-foreground">
          Primary Save uses gradient tokens. Delete uses destructive. Focus rings use ring-ring.
        </p>
      </DemoSection>
    </>
  )
}
