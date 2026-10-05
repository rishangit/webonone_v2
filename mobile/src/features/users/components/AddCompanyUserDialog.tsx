import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import {
  Button,
  CustomDialog,
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
  const [createOpen, setCreateOpen] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const addingRef = useRef(false)

  const loadUsers = useCallback(async () => {
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
    }
  }, [companyId])

  useEffect(() => {
    if (!open) {
      setCreateOpen(false)
      setCreateError(null)
      addingRef.current = false
      return
    }
    void loadUsers()
  }, [loadUsers, open])

  async function handleSelectUser(user: UserOption) {
    addingRef.current = true
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
      addingRef.current = false
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
      <UserSelectionDialog
        open={open && !createOpen}
        onOpenChange={(next) => {
          if (!next) {
            if (addingRef.current || createOpen) {
              return
            }
            onOpenChange(false)
          }
        }}
        users={users}
        title="Add user"
        onAddUser={() => setCreateOpen(true)}
        addLabel="Add user"
        onSelect={(user) => {
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
