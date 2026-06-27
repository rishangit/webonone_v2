import { StatusTag } from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

export function TagsPage() {
  return (
    <div className="space-y-10">
      <DemoSection
        id="status-tags-group-1"
        title="Status tags — group 1"
        description="Approval workflow labels with glass-tinted backgrounds and semantic borders. Use the theme toolbar above to verify light and dark modes."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusTag variant="pending" />
          <StatusTag variant="rejected" />
          <StatusTag variant="approved" />
        </div>
      </DemoSection>
    </div>
  )
}
