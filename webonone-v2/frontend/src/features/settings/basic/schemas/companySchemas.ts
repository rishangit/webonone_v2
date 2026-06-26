import { z } from 'zod'

export const registerCompanyFormSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255),
  logoUrl: z.string().url('Logo is required'),
})

export type RegisterCompanyFormValues = z.infer<typeof registerCompanyFormSchema>

export const superAdminLoginFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export type SuperAdminLoginFormValues = z.infer<typeof superAdminLoginFormSchema>
