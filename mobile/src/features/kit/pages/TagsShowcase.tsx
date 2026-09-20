import { View } from 'react-native'
import { StatusTag, TagChip } from '@webonone/mobile-ui'
import { DemoSection } from '@/features/kit/DemoSection'

const DEMO_COLOR_TAGS = [
  { name: 'Featured', color: '#3366FF' },
  { name: 'New Arrival', color: '#16A34A' },
  { name: 'Sale', color: '#DC2626' },
  { name: 'Limited', color: '#D97706' },
  { name: 'Seasonal', color: '#7C3AED' },
]

export function TagsShowcase() {
  return (
    <View className="gap-4">
      <DemoSection
        title="Catalog color tags"
        description="Catalog tags: # prefix and label in the tag color — no pill border."
      >
        <View className="flex-row flex-wrap items-center gap-2">
          {DEMO_COLOR_TAGS.map((tag) => (
            <TagChip key={tag.name} name={tag.name} color={tag.color} />
          ))}
        </View>
      </DemoSection>

      <DemoSection title="Company status tags" description="Pending, Approved, Rejected.">
        <View className="flex-row flex-wrap gap-2">
          <StatusTag variant="pending" />
          <StatusTag variant="approved" />
          <StatusTag variant="rejected" />
        </View>
      </DemoSection>

      <DemoSection title="Verification status tags" description="Unverified and Verified.">
        <View className="flex-row flex-wrap gap-2">
          <StatusTag variant="unverified" />
          <StatusTag variant="verified" />
        </View>
      </DemoSection>

      <DemoSection title="User role tags" description="Super Admin, Company Owner, Member, Staff.">
        <View className="flex-row flex-wrap gap-2">
          <StatusTag variant="super_admin" />
          <StatusTag variant="company_admin" />
          <StatusTag variant="member" />
          <StatusTag variant="staff" />
        </View>
      </DemoSection>
    </View>
  )
}
