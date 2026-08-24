import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@webonone/ui-kit'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'
import { sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'

type ReassignSessionStaffDialogProps = {
  open: boolean
  eventId: string
  occurrenceDate: string
  currentStaffId: string
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
  const [staff, setStaff] = useState<CompanyStaff[]>([])
  const [staffId, setStaffId] = useState(currentStaffId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStaffId(currentStaffId)
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
    if (!staffId || staffId === currentStaffId) {
      setError('Choose a different staff member')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await sessionTokensApi.reassignStaff(eventId, occurrenceDate, staffId)
      onReassigned()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign staff')
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
      footer={
        <Button type="button" disabled={saving || loading} onClick={() => void submit()}>
          {saving ? 'Saving…' : 'Reassign'}
        </Button>
      }
    >
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </CustomDialog>
  )
}
