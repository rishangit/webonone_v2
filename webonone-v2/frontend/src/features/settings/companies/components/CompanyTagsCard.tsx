import { TagChip } from '@webonone/ui-kit'
import type { CompanyTag } from '@/features/settings/basic/services/companyApi'
import { EditableSectionCard } from './EditableSectionCard'

type CompanyTagsCardProps = {
  tags: CompanyTag[]
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyTagsCard({ tags, canEdit, onEdit }: CompanyTagsCardProps) {
  return (
    <EditableSectionCard
      title="Tags"
      description="Catalog tags associated with this company"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tags yet. Edit this section to associate catalog tags.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      )}
    </EditableSectionCard>
  )
}
