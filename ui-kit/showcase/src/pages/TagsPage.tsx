import { StatusTag } from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

export function TagsPage() {
  return (
    <div className="space-y-10">
      <DemoSection
        id="company-status-tags"
        title="Company status tags"
        description="Approval workflow labels for company registration (Pending, Approved, Rejected). Use the theme toolbar above to verify light and dark modes. Consumers map companies.status to StatusTag variant."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusTag variant="pending" />
          <StatusTag variant="approved" />
          <StatusTag variant="rejected" />
        </div>
      </DemoSection>
    </div>
  )
}
