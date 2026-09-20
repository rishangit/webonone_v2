import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  EditableSectionCard,
  FormField,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  ListPageFooter,
  Muted,
  PageHeader,
  ReadOnlyField,
  SearchInput,
  StatusTag,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TextField,
} from '@webonone/mobile-ui'
import { useClientInfiniteList } from '@/shared/hooks/useClientInfiniteList'

const ITEMS = [
  { id: '1', name: 'Ocean', status: 'active' as const, city: 'Colombo', email: 'ocean@example.com' },
  { id: '2', name: 'Forest', status: 'pending' as const, city: 'Kandy', email: 'forest@example.com' },
  { id: '3', name: 'Summer', status: 'active' as const, city: 'Galle', email: 'summer@example.com' },
  { id: '4', name: 'Harbor', status: 'pending' as const, city: 'Negombo', email: 'harbor@example.com' },
]

type PagesNestedTab = 'list' | 'details'

type DetailsSection = 'profile' | 'contact' | 'address'

type ProfileDetails = {
  displayName: string
  email: string
  bio: string
  phoneNumber: string
  locale: string
  addressLine1: string
  city: string
  country: string
}

const INITIAL_PROFILE_DETAILS: ProfileDetails = {
  displayName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  bio: 'Profile details page pattern with per-card edit icons.',
  phoneNumber: '+1 555 0100',
  locale: 'en-US',
  addressLine1: '120 Platform Avenue',
  city: 'San Francisco',
  country: 'US',
}

function SectionEditActions({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button size="sm" variant="outline" onPress={onCancel}>Cancel</Button>
      <Button size="sm" onPress={onSave}>Save</Button>
    </View>
  )
}

function ListPageDemo({ onOpenDetails }: { onOpenDetails: () => void }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? ITEMS.filter((item) => item.name.toLowerCase().includes(q)) : ITEMS
  }, [query])
  const pagination = useClientInfiniteList(filtered, 2, query)

  return (
    <View className="gap-3">
      <ListPageActions>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder="Item name"
          accessibilityLabel="Search catalog items"
        />
        <ListAddButton onPress={() => undefined}>Add item</ListAddButton>
      </ListPageActions>
      {filtered.length === 0 ? <ItemListEmpty>No items match your search.</ItemListEmpty> : null}
      <ListPageBody>
        <ItemList>
          {pagination.visibleItems.map((item) => (
            <ItemListItem key={item.id} selected={item.status === 'active'} onPress={onOpenDetails}>
              <ItemListContent title={item.name} subtitle={item.city} />
              <StatusTag variant={item.status === 'active' ? 'verified' : 'unverified'} />
              <ItemListMenu ariaLabel={`Actions — ${item.name}`}>
                <ItemListMenuItem onPress={onOpenDetails}>View details</ItemListMenuItem>
                <ItemListMenuItem>Edit</ItemListMenuItem>
              </ItemListMenu>
            </ItemListItem>
          ))}
        </ItemList>
        <ListPageFooter
          loadedCount={pagination.loadedCount}
          totalCount={pagination.totalCount}
          hasMore={pagination.hasMore}
          loadingMore={pagination.loadingMore}
        />
      </ListPageBody>
      <Muted>Production list screens pass `onScroll` from `useListPageScroll` to `FeatureScreen`.</Muted>
    </View>
  )
}

function DetailsPageDemo({ onBack }: { onBack: () => void }) {
  const [savedValues, setSavedValues] = useState<ProfileDetails>(INITIAL_PROFILE_DETAILS)
  const [values, setValues] = useState<ProfileDetails>(INITIAL_PROFILE_DETAILS)
  const [editingSection, setEditingSection] = useState<DetailsSection | null>(null)

  function startEdit(section: DetailsSection) {
    setValues(savedValues)
    setEditingSection(section)
  }

  function cancelEdit() {
    setValues(savedValues)
    setEditingSection(null)
  }

  function saveSection() {
    setSavedValues(values)
    setEditingSection(null)
  }

  return (
    <View className="gap-4">
      <PageHeader
        title="Details page"
        description="Read-only section cards — touch a card to reveal its edit icon."
        onBack={onBack}
        backLabel="Back"
      />

      <EditableSectionCard
        title="Profile"
        description="Identity and short bio for this account"
        canEdit
        onEdit={() => startEdit('profile')}
      >
        {editingSection === 'profile' ? (
          <>
            <FormField label="Display name">
              <TextField
                value={values.displayName}
                onChangeText={(displayName) => setValues((current) => ({ ...current, displayName }))}
              />
            </FormField>
            <FormField label="Bio">
              <Textarea
                value={values.bio}
                onChangeText={(bio) => setValues((current) => ({ ...current, bio }))}
              />
            </FormField>
            <SectionEditActions onCancel={cancelEdit} onSave={saveSection} />
          </>
        ) : (
          <View className="flex-row items-start gap-3">
            <ImagePreview src={null} alt={savedValues.displayName} className="h-16 w-16 rounded-full" />
            <View className="min-w-0 flex-1 gap-1">
              <Body className="text-lg font-semibold">{savedValues.displayName}</Body>
              <Muted>{savedValues.email}</Muted>
              <Body className="text-sm">{savedValues.bio}</Body>
            </View>
          </View>
        )}
      </EditableSectionCard>

      <EditableSectionCard
        title="Contact"
        description="How others can reach you"
        canEdit
        onEdit={() => startEdit('contact')}
      >
        {editingSection === 'contact' ? (
          <>
            <FormField label="Email">
              <TextField
                value={values.email}
                onChangeText={(email) => setValues((current) => ({ ...current, email }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FormField>
            <FormField label="Phone number">
              <TextField
                value={values.phoneNumber}
                onChangeText={(phoneNumber) => setValues((current) => ({ ...current, phoneNumber }))}
                keyboardType="phone-pad"
              />
            </FormField>
            <FormField label="Locale">
              <TextField
                value={values.locale}
                onChangeText={(locale) => setValues((current) => ({ ...current, locale }))}
              />
            </FormField>
            <SectionEditActions onCancel={cancelEdit} onSave={saveSection} />
          </>
        ) : (
          <>
            <ReadOnlyField label="Email" value={savedValues.email} />
            <ReadOnlyField label="Phone number" value={savedValues.phoneNumber} />
            <ReadOnlyField label="Locale" value={savedValues.locale} />
          </>
        )}
      </EditableSectionCard>

      <EditableSectionCard
        title="Address"
        description="Postal / street address"
        canEdit
        onEdit={() => startEdit('address')}
      >
        {editingSection === 'address' ? (
          <>
            <FormField label="Address line 1">
              <TextField
                value={values.addressLine1}
                onChangeText={(addressLine1) => setValues((current) => ({ ...current, addressLine1 }))}
              />
            </FormField>
            <FormField label="City">
              <TextField
                value={values.city}
                onChangeText={(city) => setValues((current) => ({ ...current, city }))}
              />
            </FormField>
            <FormField label="Country">
              <TextField
                value={values.country}
                onChangeText={(country) => setValues((current) => ({ ...current, country }))}
                autoCapitalize="characters"
                maxLength={2}
              />
            </FormField>
            <SectionEditActions onCancel={cancelEdit} onSave={saveSection} />
          </>
        ) : (
          <>
            <ReadOnlyField label="Address line 1" value={savedValues.addressLine1} />
            <ReadOnlyField label="City" value={savedValues.city} />
            <ReadOnlyField label="Country" value={savedValues.country} />
          </>
        )}
      </EditableSectionCard>
    </View>
  )
}

export function PagesShowcase() {
  const [nested, setNested] = useState<PagesNestedTab>('list')

  return (
    <View className="gap-3">
      <Muted>
        Page-level compositions that mirror production FeatureScreen screens. Prefer copying these
        patterns over the isolated Components demos.
      </Muted>
      <Tabs value={nested} onValueChange={(value) => setNested(value as PagesNestedTab)}>
        <TabsList>
          <TabsTrigger value="list">List page</TabsTrigger>
          <TabsTrigger value="details">Details page</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ListPageDemo onOpenDetails={() => setNested('details')} />
        </TabsContent>
        <TabsContent value="details">
          <DetailsPageDemo onBack={() => setNested('list')} />
        </TabsContent>
      </Tabs>
    </View>
  )
}
