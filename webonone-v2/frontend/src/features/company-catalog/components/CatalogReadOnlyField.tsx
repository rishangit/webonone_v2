import type { ReactNode } from 'react'
import { ReadOnlyField } from '@webonone/ui-kit'
import { CatalogEditedLabel } from '@/features/company-catalog/components/CatalogEditedLabel'

type CatalogReadOnlyFieldProps = {
  label: string
  value?: ReactNode
  edited?: boolean
}

export function CatalogReadOnlyField({ label, value, edited = false }: CatalogReadOnlyFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-label">{label}</p>
        <CatalogEditedLabel show={edited} />
      </div>
      <ReadOnlyField label="" value={value} className="[&>p:first-child]:hidden" />
    </div>
  )
}
