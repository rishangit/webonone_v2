import { z } from 'zod'

export const brandingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  logoUrl: z.union([z.string().url('Enter a valid URL'), z.literal('')]),
  primaryColor: z
    .string()
    .min(1, 'Primary color is required')
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color like #2563eb'),
  contactEmail: z.string().min(1, 'Contact email is required').email('Enter a valid email'),
  footerHtml: z.string().optional(),
})

export type BrandingFormValues = z.infer<typeof brandingSchema>
