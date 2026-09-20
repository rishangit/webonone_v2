import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  FullCalendar,
  Muted,
  RemainingTime,
  SelectMedia,
  type FullCalendarView,
  SelectTag,
  SelectUser,
  TagSelectionDialog,
  UserSelectionDialog,
  type SelectMediaValue,
  type SelectTagValue,
  type SelectUserValue,
  type UserOption,
} from '@webonone/mobile-ui'
import { DemoSection } from '@/features/kit/DemoSection'

const MOCK_USERS: UserOption[] = [
  { id: '1', displayName: 'Alex Morgan', email: 'alex@webonone.com', role: 'super_admin' },
  { id: '2', displayName: 'Jane Doe', email: 'jane@webonone.com', role: 'company_admin' },
  { id: '3', displayName: 'Sam Kim', email: 'sam@webonone.com', role: 'staff' },
  { id: '4', displayName: 'Riley Wong', email: 'riley@webonone.com', role: 'member' },
]

const MOCK_TAGS: SelectTagValue[] = [
  { id: '1', name: 'Featured', color: '#3366FF' },
  { id: '2', name: 'New Arrival', color: '#16A34A' },
  { id: '3', name: 'Sale', color: '#DC2626' },
  { id: '4', name: 'Limited', color: '#D97706' },
]

const MOCK_MEDIA: SelectMediaValue[] = [
  { id: '1', url: 'https://placehold.co/120x120/1e293b/f8fafc/png?text=A', alt: 'Asset A' },
  { id: '2', url: 'https://placehold.co/120x120/344CE2/ffffff/png?text=B', alt: 'Asset B' },
]

export function ComplexControlsShowcase() {
  const [user, setUser] = useState<SelectUserValue | null>(MOCK_USERS[0] ?? null)
  const [users, setUsers] = useState<SelectUserValue[]>(MOCK_USERS.slice(0, 2))
  const [userOpen, setUserOpen] = useState(false)
  const [multiUserOpen, setMultiUserOpen] = useState(false)
  const [tag, setTag] = useState<SelectTagValue | null>(MOCK_TAGS[0] ?? null)
  const [tags, setTags] = useState<SelectTagValue[]>(MOCK_TAGS.slice(0, 2))
  const [tagOpen, setTagOpen] = useState(false)
  const [multiTagOpen, setMultiTagOpen] = useState(false)
  const [media, setMedia] = useState<SelectMediaValue | null>(null)
  const now = useMemo(() => new Date(), [])
  const upcomingStart = new Date(now.getTime() + 45 * 60_000).toISOString()
  const upcomingEnd = new Date(now.getTime() + 90 * 60_000).toISOString()
  const currentStart = new Date(now.getTime() - 10 * 60_000).toISOString()
  const currentEnd = new Date(now.getTime() + 20 * 60_000).toISOString()
  const endedStart = new Date(now.getTime() - 90 * 60_000).toISOString()
  const endedEnd = new Date(now.getTime() - 30 * 60_000).toISOString()
  const [calendarView, setCalendarView] = useState<FullCalendarView>('month')
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date())

  return (
    <View className="gap-4">
      <DemoSection
        title="Full calendar"
        description="Day, week, and month views with event chips — same board as web Schedule."
      >
        <FullCalendar
          view={calendarView}
          onViewChange={setCalendarView}
          anchorDate={calendarAnchor}
          onAnchorDateChange={setCalendarAnchor}
          events={[
            {
              id: 'demo-1',
              title: 'Consultation',
              start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
              end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
            },
            {
              id: 'demo-2',
              title: 'Follow-up',
              start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0),
              end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0),
              subtitle: 'Staff on leave',
              issueDetail: 'Assigned staff is on approved leave for this session.',
            },
          ]}
        />
      </DemoSection>

      <DemoSection
        title="Remaining time"
        description="Countdown chips for upcoming, current, and ended sessions."
      >
        <View className="flex-row flex-wrap gap-2">
          <RemainingTime start={upcomingStart} end={upcomingEnd} now={now} />
          <RemainingTime start={currentStart} end={currentEnd} now={now} />
          <RemainingTime start={endedStart} end={endedEnd} now={now} />
        </View>
        <Muted>Plain appearance</Muted>
        <RemainingTime start={upcomingStart} end={upcomingEnd} now={now} appearance="plain" />
      </DemoSection>

      <DemoSection title="Select user" description="Trigger control plus directory dialog.">
        <SelectUser selectedUser={user} onPress={() => setUserOpen(true)} />
        <SelectUser multiple selectedUsers={users} onPress={() => setMultiUserOpen(true)} />
        <UserSelectionDialog
          open={userOpen}
          onOpenChange={setUserOpen}
          users={MOCK_USERS}
          selectedId={user?.id}
          onSelect={setUser}
        />
        <UserSelectionDialog
          open={multiUserOpen}
          onOpenChange={setMultiUserOpen}
          users={MOCK_USERS}
          selectedId={users[0]?.id}
          onSelect={(next) => setUsers((current) => (current.some((item) => item.id === next.id) ? current : [...current, next]))}
        />
      </DemoSection>

      <DemoSection title="Select tag" description="Catalog color tags with picker dialog.">
        <SelectTag selectedTag={tag} onPress={() => setTagOpen(true)} />
        <SelectTag multiple selectedTags={tags} onPress={() => setMultiTagOpen(true)} />
        <TagSelectionDialog
          open={tagOpen}
          onOpenChange={setTagOpen}
          tags={MOCK_TAGS}
          selectedId={tag?.id}
          onSelect={setTag}
        />
        <TagSelectionDialog
          open={multiTagOpen}
          onOpenChange={setMultiTagOpen}
          tags={MOCK_TAGS}
          selectedId={tags[0]?.id}
          onSelect={(next) => setTags((current) => (current.some((item) => item.id === next.id) ? current : [...current, next]))}
        />
      </DemoSection>

      <DemoSection title="Select media" description="Image picker trigger. Tap to cycle mock assets.">
        <SelectMedia
          value={media}
          onPress={() => {
            const currentIndex = MOCK_MEDIA.findIndex((item) => item.id === media?.id)
            setMedia(MOCK_MEDIA[(currentIndex + 1) % MOCK_MEDIA.length] ?? null)
          }}
        />
        <Body className="text-sm text-muted">Tap to preview the next mock asset.</Body>
      </DemoSection>
    </View>
  )
}
