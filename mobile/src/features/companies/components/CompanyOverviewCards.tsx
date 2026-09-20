import { Linking, View } from 'react-native'
import {
  Body,
  Button,
  EditableSectionCard,
  isStatusTagVariant,
  Muted,
  ReadOnlyField,
  StatusTag,
  TagChip,
} from '@webonone/mobile-ui'
import type { CompanyDetail } from '@/features/companies/services/companyApi'
import { formatCountryName } from '@/features/companies/utils/formatCountryName'

export type CompanyEditSection =
  | 'profile'
  | 'contact'
  | 'location'
  | 'address'
  | 'tags'

function hasContactInfo(detail: CompanyDetail): boolean {
  return Boolean(detail.contactPerson || detail.contactEmail || detail.contactPhone)
}

function hasAddressInfo(detail: CompanyDetail): boolean {
  return Boolean(detail.addressLine1 || detail.addressLine2 || detail.city || detail.country)
}

function hasLocationInfo(detail: CompanyDetail): boolean {
  return Boolean(
    detail.latitude != null ||
      detail.longitude != null ||
      detail.mapFormattedAddress?.trim(),
  )
}

export function CompanyProfileCard({
  detail,
  canEdit,
  onEdit,
}: {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}) {
  return (
    <EditableSectionCard
      title="Company profile"
      description="Name, description, and public website"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Body className="text-xl font-semibold">{detail.name}</Body>
        <StatusTag variant={detail.status} />
      </View>
      {detail.role ? (
        isStatusTagVariant(detail.role) ? (
          <StatusTag variant={detail.role} />
        ) : (
          <Muted>{detail.role}</Muted>
        )
      ) : (
        <Muted>Platform administrator view</Muted>
      )}
      <ReadOnlyField label="Description" value={detail.description} />
      <ReadOnlyField label="Company size" value={detail.companySize} />
      {detail.webUrl ? (
        <View className="gap-1">
          <Muted className="text-xs uppercase tracking-wide">Website</Muted>
          <Body className="text-primary">{detail.webUrl}</Body>
          <Muted>Public company page on the platform</Muted>
        </View>
      ) : null}
    </EditableSectionCard>
  )
}

export function CompanyContactCard({
  detail,
  canEdit,
  onEdit,
}: {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}) {
  return (
    <EditableSectionCard
      title="Contact information"
      description="Primary contact for this company"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {!hasContactInfo(detail) ? (
        <Muted>No contact information added yet.</Muted>
      ) : null}
      <ReadOnlyField label="Contact person" value={detail.contactPerson?.displayName} />
      <ReadOnlyField label="Contact email" value={detail.contactEmail} />
      <ReadOnlyField label="Contact phone" value={detail.contactPhone} />
    </EditableSectionCard>
  )
}

export function CompanyLocationCard({
  detail,
  canEdit,
  onEdit,
}: {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}) {
  const canOpenMaps =
    detail.latitude != null &&
    detail.longitude != null &&
    Number.isFinite(detail.latitude) &&
    Number.isFinite(detail.longitude)

  return (
    <EditableSectionCard
      title="Location information"
      description="Map pin for this company"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {!hasLocationInfo(detail) ? (
        <Muted>No map location set.</Muted>
      ) : (
        <>
          {detail.mapFormattedAddress ? (
            <ReadOnlyField label="Map address" value={detail.mapFormattedAddress} />
          ) : null}
          {detail.latitude != null && detail.longitude != null ? (
            <ReadOnlyField
              label="Coordinates"
              value={`${detail.latitude}, ${detail.longitude}`}
            />
          ) : null}
          {canOpenMaps ? (
            <Button
              size="sm"
              variant="outline"
              onPress={() =>
                void Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`,
                )
              }
            >
              Open in maps
            </Button>
          ) : null}
        </>
      )}
    </EditableSectionCard>
  )
}

export function CompanyAddressCard({
  detail,
  canEdit,
  onEdit,
}: {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}) {
  const countryLabel = formatCountryName(detail.country) || detail.country

  return (
    <EditableSectionCard
      title="Address information"
      description="Postal and street address"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {!hasAddressInfo(detail) ? <Muted>No address added yet.</Muted> : null}
      <ReadOnlyField label="Address line 1" value={detail.addressLine1} />
      <ReadOnlyField label="Address line 2" value={detail.addressLine2} />
      <ReadOnlyField label="City" value={detail.city} />
      <ReadOnlyField label="State / region" value={detail.stateRegion} />
      <ReadOnlyField label="Postal code" value={detail.postalCode} />
      <ReadOnlyField label="Country" value={countryLabel} />
    </EditableSectionCard>
  )
}

export function CompanyTagsCard({
  detail,
  canEdit,
  onEdit,
}: {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}) {
  const tags = detail.tags ?? []

  return (
    <EditableSectionCard
      title="Tags"
      description="Catalog tags associated with this company"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {tags.length === 0 ? (
        <Muted>No tags added yet.</Muted>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </View>
      )}
    </EditableSectionCard>
  )
}

export function CompanyOverviewTab({
  detail,
  canEdit,
  onEditSection,
}: {
  detail: CompanyDetail
  canEdit?: boolean
  onEditSection?: (section: CompanyEditSection) => void
}) {
  return (
    <View className="gap-6">
      <CompanyProfileCard
        detail={detail}
        canEdit={canEdit}
        onEdit={onEditSection ? () => onEditSection('profile') : undefined}
      />
      <CompanyContactCard
        detail={detail}
        canEdit={canEdit}
        onEdit={onEditSection ? () => onEditSection('contact') : undefined}
      />
      <CompanyLocationCard
        detail={detail}
        canEdit={canEdit}
        onEdit={onEditSection ? () => onEditSection('location') : undefined}
      />
      <CompanyAddressCard
        detail={detail}
        canEdit={canEdit}
        onEdit={onEditSection ? () => onEditSection('address') : undefined}
      />
      <CompanyTagsCard
        detail={detail}
        canEdit={canEdit}
        onEdit={onEditSection ? () => onEditSection('tags') : undefined}
      />
    </View>
  )
}
