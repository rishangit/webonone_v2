import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  NativeSelect,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type ReassignSessionStaffDialogProps = {
  open: boolean
  eventId: string
  occurrenceDate: string
  currentStaffId: string | null
  onOpenChange: (open: boolean) => void
  onReassigned: () => void
}

export function ReassignSessionStaffDialog({
  open,
  eventId,
  occurrenceDate,
  currentStaffId,
  onOpenChange,
  onReassigned,
}: ReassignSessionStaffDialogProps) {
  const { toast } = useToast()
  const [staff, setStaff] = useState<CompanyStaff[]>([])
  const [staffId, setStaffId] = useState(currentStaffId ?? '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStaffId(currentStaffId ?? '')
    setError(null)
    setLoading(true)
    void staffApi
      .list({ page: 1, pageSize: 200 })
      .then((result) => {
        setStaff(result.items)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load staff')
        setLoading(false)
      })
  }, [open, currentStaffId])

  async function submit() {
    if (!staffId || (currentStaffId != null && staffId === currentStaffId)) {
      setError('Choose a different staff member')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await sessionTokensApi.reassignStaff(eventId, occurrenceDate, staffId)
      toast({ title: 'Staff reassigned' })
      onReassigned()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reassign staff'
      setError(message)
      toast({ title: 'Failed to reassign staff', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reassign staff"
      description="Assign another staff member for this session date."
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <View className="flex-row flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving || loading} onPress={() => void submit()}>
            {saving ? 'Saving…' : 'Reassign'}
          </Button>
        </View>
      }
    >
      {loading ? (
        <Spinner label="Loading staff…" />
      ) : (
        <View className="gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <NativeSelect
            label="Staff"
            required
            value={staffId}
            onValueChange={setStaffId}
            placeholder="Select staff"
            allowEmpty={false}
            options={staff.map((item) => ({ value: item.id, label: item.displayName }))}
          />
        </View>
      )}
    </CustomDialog>
  )
}
