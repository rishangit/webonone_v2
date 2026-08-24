import { z } from 'zod'
import { LEAVE_TYPES } from '@/features/staff/types/staffLeave.types'

const ymdDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export const staffLeaveFormSchema = z
  .object({
    leaveType: z.enum(LEAVE_TYPES, { message: 'Leave type is required' }),
    startDate: ymdDate,
    endDate: ymdDate,
    reason: z.string().trim().max(1000).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.startDate > body.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after start date',
        path: ['endDate'],
      })
    }
  })

export type StaffLeaveFormValues = z.infer<typeof staffLeaveFormSchema>

export function createEmptyStaffLeaveForm(): StaffLeaveFormValues {
  return {
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  }
}

export function toCreateStaffLeavePayload(values: StaffLeaveFormValues) {
  return {
    leave_type: values.leaveType,
    start_date: values.startDate,
    end_date: values.endDate,
    reason: values.reason?.trim() ? values.reason.trim() : null,
  }
}
