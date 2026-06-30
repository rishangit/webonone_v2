import { useMemo, useState } from 'react'
import {
  Button,
  type LoadUsersFn,
  type UserOption,
  UserSelectionDialog,
} from '@webonone/ui-kit'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'company_admin', label: 'Company admin' },
  { value: 'super_admin', label: 'Super admin' },
]

const MOCK_USERS: UserOption[] = Array.from({ length: 120 }, (_, index) => ({
  id: `demo-user-${index + 1}`,
  displayName: `Demo User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  role: ROLE_OPTIONS[index % ROLE_OPTIONS.length]!.value,
}))

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

const loadDemoUsers: LoadUsersFn = async ({ search, role, page, pageSize }) => {
  await delay(350)

  let filtered = MOCK_USERS
  const query = search.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    )
  }
  if (role) {
    filtered = filtered.filter((user) => user.role === role)
  }

  const start = (page - 1) * pageSize
  const users = filtered.slice(start, start + pageSize)

  return {
    users,
    hasMore: start + pageSize < filtered.length,
  }
}

export function UserSelectionDemo() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<UserOption | null>(null)
  const loadUsers = useMemo(() => loadDemoUsers, [])

  return (
    <section className="space-y-3 rounded-lg border border-border p-6">
      <div>
        <h2 className="text-lg font-medium">User selection (demo)</h2>
        <p className="text-sm text-muted-foreground">
          Reusable dialog with search, role filter, and infinite scroll — mock data until a users API is available.
        </p>
      </div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Choose user
      </Button>
      <p className="text-sm text-muted-foreground">
        Selected:{' '}
        {selected ? (
          <span className="text-foreground">
            {selected.displayName} · {selected.email}
          </span>
        ) : (
          '(none)'
        )}
      </p>
      <UserSelectionDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={setSelected}
        loadUsers={loadUsers}
        roleOptions={ROLE_OPTIONS}
        description="Pick a user from the directory. Selection closes the dialog immediately."
      />
    </section>
  )
}
