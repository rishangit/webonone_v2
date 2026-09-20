import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Button,
  CustomDialog,
  SelectUser,
  Spinner,
  UserSelectionDialog,
  type UserOption,
  useToast,
} from '@webonone/mobile-ui'
import { CreateCompanyUserForm, submitCreateCompanyUserForm } from '@/features/users/components/CreateCompanyUserForm'
import {
  addCompanyCustomer,
  createCompanyCustomer,
  listUsers,
} from '@/features/users/services/usersApi'
import type { CreateCompanyUserPayload } from '@/features/users/schemas/createCompanyUserSchemas'

type AddCompanyUserDialogProps = {
  open: boolean
  companyId: string
  companyName?: string | null
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}

export function AddCompanyUserDialog({
  open,
  companyId,
  companyName,
  onOpenChange,
  onAdded,
}: AddCompanyUserDialogProps) {
  const { toast } = useToast()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selected, setSelected] = useState<UserOption | null>(null)
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const result = await listUsers({
        page: 1,
        pageSize: 100,
        excludeCompanyId: companyId,
      })
      setUsers(
        result.items.map((user) => ({
          id: user.id,
          displayName: user.displayName,
          email: user.email ?? '',
          role: user.role,
          avatarUrl: user.avatarUrl,
        })),
      )
    } catch {
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }, [companyId])

  useEffect(() => {
    if (!open) {
      setSelected(null)
      setCreateOpen(false)
      setPickerOpen(false)
      setCreateError(null)
      return
    }
    void loadUsers()
  }, [loadUsers, open])

  async function handleSelectUser(user: UserOption) {
    setAdding(true)
    try {
      await addCompanyCustomer({
        companyId,
        userId: user.id,
        companyName: companyName ?? undefined,
      })
      toast({ title: 'User added' })
      onOpenChange(false)
      onAdded()
    } catch (err) {
      toast({
        title: 'Failed to add user',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setAdding(false)
    }
  }

  async function handleCreate(values: CreateCompanyUserPayload) {
    setCreating(true)
    setCreateError(null)
    try {
      await createCompanyCustomer({
        companyId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        companyName: companyName ?? undefined,
      })
      toast({ title: 'User added' })
      setCreateOpen(false)
      onOpenChange(false)
      onAdded()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Add user"
        description="Select a registered user, or register someone new."
        sizeWidth="medium"
        sizeHeight="auto"
        nestedDismissGuard={pickerOpen || createOpen}
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onPress={() => onOpenChange(false)} disabled={adding}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onPress={() => setCreateOpen(true)}
              disabled={adding || creating}
            >
              Register new
            </Button>
            <Button
              onPress={() => setPickerOpen(true)}
              disabled={adding || creating || loadingUsers}
            >
              {adding ? 'Adding…' : 'Select user'}
            </Button>
          </View>
        }
      >
        {loadingUsers ? <Spinner label="Loading users…" /> : null}
        {selected ? (
          <SelectUser selectedUser={selected} onPress={() => setPickerOpen(true)} />
        ) : (
          <SelectUser placeholder="No user selected" onPress={() => setPickerOpen(true)} />
        )}
      </CustomDialog>

      <UserSelectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        users={users}
        selectedId={selected?.id}
        title="Select user"
        onSelect={(user) => {
          setSelected(user)
          setPickerOpen(false)
          void handleSelectUser(user)
        }}
      />

      <CustomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Register user"
        description="Add someone who is not registered yet."
        sizeWidth="small"
        sizeHeight="auto"
        stackLevel={1}
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onPress={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onPress={() => submitCreateCompanyUserForm()} disabled={creating}>
              {creating ? 'Registering…' : 'Register user'}
            </Button>
          </View>
        }
      >
        <CreateCompanyUserForm
          error={createError}
          disabled={creating}
          onValidSubmit={(values) => void handleCreate(values)}
        />
      </CustomDialog>
    </>
  )
}
