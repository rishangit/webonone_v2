import { StatusTag, TagChip } from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

const DEMO_COLOR_TAGS = [
  { name: 'Featured', color: '#3366FF' },
  { name: 'New Arrival', color: '#16A34A' },
  { name: 'Sale', color: '#DC2626' },
  { name: 'Limited', color: '#D97706' },
  { name: 'Seasonal', color: '#7C3AED' },
]

export function TagsPage() {
  return (
    <div className="space-y-10">
      <DemoSection
        id="catalog-color-tags"
        title="Catalog color tags"
        description="Colored pills for catalog tags (products, services, spaces, companies). Border, light tint background, solid dot, and label all use the tag color. Same chip as SelectTag selected values and detail pages."
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {DEMO_COLOR_TAGS.map((tag) => (
            <TagChip key={tag.name} name={tag.name} color={tag.color} />
          ))}
        </div>
      </DemoSection>

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

      <DemoSection
        id="verification-status-tags"
        title="Verification status tags"
        description="Catalog verification labels (Unverified, Verified). Orange = awaiting super-admin review; teal = approved reference data. Map API status pending → unverified, verified → verified."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusTag variant="unverified" />
          <StatusTag variant="verified" />
        </div>
      </DemoSection>

      <DemoSection
        id="user-role-tags"
        title="User role tags"
        description="Platform membership roles (Super Admin, Company Admin, Member, Staff). Violet / sky / slate / indigo glass chips. Map API role strings to StatusTag variant; use isStatusTagVariant for unknown roles."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusTag variant="super_admin" />
          <StatusTag variant="company_admin" />
          <StatusTag variant="member" />
          <StatusTag variant="staff" />
        </div>
      </DemoSection>
    </div>
  )
}
