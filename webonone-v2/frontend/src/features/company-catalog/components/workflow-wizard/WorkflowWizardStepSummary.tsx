import type { WorkflowWizardValues } from '@/features/company-catalog/schemas/workflowSchemas'

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value || '—'}</dd>
    </div>
  )
}

type WorkflowWizardStepSummaryProps = {
  values: WorkflowWizardValues
  orderNumber: number
  showQueue?: boolean
}

export function WorkflowWizardStepSummary({
  values,
  orderNumber,
  showQueue = false,
}: WorkflowWizardStepSummaryProps) {
  return (
    <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
      <h3 className="text-lg font-medium text-foreground">Workflow item #{orderNumber}</h3>
      <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
        <SummaryRow label="Order" value={`#${orderNumber}`} />
        <SummaryRow label="Space" value={values.space?.name ?? '—'} />
        <SummaryRow
          label="Staff"
          value={
            values.staff.length > 0
              ? values.staff.map((entry) => entry.displayName).join(', ')
              : 'None'
          }
        />
        <SummaryRow
          label="Forms"
          value={
            values.forms.length > 0 ? values.forms.map((form) => form.name).join(', ') : 'None'
          }
        />
        {showQueue ? (
          <SummaryRow label="Session queue" value={values.sessionQueue ? 'Yes' : 'No'} />
        ) : null}
        <SummaryRow label="Add items" value={values.addItemsEnabled ? 'Yes' : 'No'} />
      </dl>
    </div>
  )
}
