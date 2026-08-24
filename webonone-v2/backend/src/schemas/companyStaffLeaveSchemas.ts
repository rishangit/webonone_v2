import { z } from 'zod'

export const LEAVE_TYPES = ['annual', 'sick', 'casual', 'unpaid', 'other'] as const
export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const

const ymdDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export const createCompanyStaffLeaveBodySchema = z
  .object({
    leave_type: z.enum(LEAVE_TYPES),
    start_date: ymdDate,
    end_date: ymdDate,
    reason: z.string().trim().max(1000).nullable().optional(),
  })
  .superRefine((body, ctx) => {
    if (body.start_date > body.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after start date',
        path: ['end_date'],
      })
    }
  })

export const listCompanyStaffLeavesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12),
  status: z.enum(['all', ...LEAVE_STATUSES]).optional().default('all'),
})

export type CreateCompanyStaffLeaveBody = z.infer<typeof createCompanyStaffLeaveBodySchema>
export type ListCompanyStaffLeavesQuery = z.infer<typeof listCompanyStaffLeavesQuerySchema>
export type LeaveType = (typeof LEAVE_TYPES)[number]
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]
