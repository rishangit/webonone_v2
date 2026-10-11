/** Theme-independent semantic colors (`--fixed-color-*` in globals.css). */
export const FIXED_APP_COLOR_CSS_VARS = {
  pending: '--fixed-color-pending',
  approved: '--fixed-color-approved',
  rejected: '--fixed-color-rejected',
} as const

export type FixedAppColorId = keyof typeof FIXED_APP_COLOR_CSS_VARS

export const FIXED_APP_COLOR_SWATCHES: {
  id: FixedAppColorId
  label: string
  utility: string
  usage: string
}[] = [
  {
    id: 'pending',
    label: 'Pending',
    utility: 'text-fixed-pending',
    usage: 'Cost price, pending approval, unverified states',
  },
  {
    id: 'approved',
    label: 'Approved',
    utility: 'text-fixed-approved',
    usage: 'Sell price, approved / verified success states',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    utility: 'text-fixed-rejected',
    usage: 'Rejected / error emphasis (fixed hue)',
  },
]
