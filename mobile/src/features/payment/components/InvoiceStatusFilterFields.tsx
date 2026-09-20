import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/mobile-ui'

export function InvoiceStatusFilterFields({
  value,
  onChange,
}: {
  value: string
  onChange: (status: string) => void
}) {
  return (
    <FormField label="Status">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="issued">Issued</SelectItem>
          <SelectItem value="pending_verification">Pending review</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="void">Void</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}
