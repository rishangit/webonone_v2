import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarGroup,
  Badge,
  Body,
  Button,
  Card,
  Heading,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  Muted,
  ListPageBody,
  ListPageFooter,
  Pagination,
  ReadOnlyField,
  Spinner,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { DemoSection } from '@/features/kit/DemoSection'

const demoAvatarUsers = [
  { src: 'https://i.pravatar.cc/150?img=11', fallback: 'AM', alt: 'Alex Morgan', name: 'Alex Morgan' },
  { src: 'https://i.pravatar.cc/150?img=5', fallback: 'JD', alt: 'Jane Doe', name: 'Jane Doe' },
  { src: 'https://i.pravatar.cc/150?img=12', fallback: 'SK', alt: 'Sam Kim', name: 'Sam Kim' },
  { src: 'https://i.pravatar.cc/150?img=32', fallback: 'RW', alt: 'Riley Wong', name: 'Riley Wong' },
  { src: 'https://i.pravatar.cc/150?img=8', fallback: 'TC', alt: 'Taylor Chen', name: 'Taylor Chen' },
]

export function ComponentsShowcase() {
  const { toast } = useToast()

  return (
    <View className="gap-4">
      <DemoSection title="Typography">
        <Heading>Heading</Heading>
        <Subheading>Subheading</Subheading>
        <Body>Body copy</Body>
        <Muted>Muted helper</Muted>
      </DemoSection>

      <DemoSection title="Avatars">
        <View className="flex-row flex-wrap items-end gap-4">
          <Avatar size="xs" fallback="JD" />
          <Avatar size="sm" fallback="JD" />
          <Avatar size="md" fallback="JD" />
          <Avatar size="lg" fallback="JD" />
          <Avatar size="xl" fallback="JD" />
        </View>
        <AvatarGroup users={demoAvatarUsers} size="md" max={4} />
      </DemoSection>

      <DemoSection title="Card and read-only field">
        <Card className="gap-3">
          <Subheading>Profile</Subheading>
          <ReadOnlyField label="Name" value="Alex Morgan" />
          <ReadOnlyField label="Email" value="alex@webonone.com" />
        </Card>
      </DemoSection>

      <DemoSection title="Alert">
        <Alert>
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Changes apply on the next refresh.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>Check the network and try again.</AlertDescription>
        </Alert>
      </DemoSection>

      <DemoSection title="Image preview">
        <View className="flex-row flex-wrap gap-3">
          <ImagePreview alt="Empty" />
          <ImagePreview src="https://placehold.co/160x160/344CE2/ffffff/png?text=Theme" alt="Theme" />
          <ImagePreview
            alt="Account"
            className="h-40 w-40"
            src="https://placehold.co/160x160/344CE2/ffffff/png?text=Account"
          />
        </View>
      </DemoSection>

      <DemoSection title="Item list" description="Rows with overflow menu — reuse on collection screens.">
        <ItemList>
          <ItemListItem selected>
            <ItemListContent title="Selected row" subtitle="Active border" />
            <ItemListMenu>
              <ItemListMenuItem onPress={() => toast({ title: 'Opened details' })}>View details</ItemListMenuItem>
              <ItemListMenuSeparator />
              <ItemListMenuItem destructive onPress={() => toast({ title: 'Delete requested' })}>
                Delete
              </ItemListMenuItem>
            </ItemListMenu>
          </ItemListItem>
          <ItemListItem>
            <ItemListContent title="Default row" subtitle="Secondary line" />
            <Badge tone="success">Active</Badge>
          </ItemListItem>
        </ItemList>
        <ItemListEmpty>Empty collection state</ItemListEmpty>
      </DemoSection>

      <DemoSection title="Pagination">
        <Pagination page={2} pageCount={5} onPageChange={() => undefined} />
        <Muted>Legacy pager control — native list screens use on-scroll instead.</Muted>
      </DemoSection>

      <DemoSection title="List page footer">
        <ListPageBody className="min-h-48">
          <Body className="text-sm text-muted">Short list content above</Body>
          <ListPageFooter loadedCount={2} totalCount={2} hasMore={false} loadingMore={false} />
        </ListPageBody>
        <ListPageFooter loadedCount={24} totalCount={48} hasMore loadingMore />
      </DemoSection>

      <DemoSection title="Toast">
        <Button onPress={() => toast({ title: 'Theme applied' })}>Show toast</Button>
        <Button
          variant="outline"
          onPress={() => toast({ title: 'Save failed', description: 'Network error', variant: 'destructive' })}
        >
          Destructive toast
        </Button>
      </DemoSection>

      <Spinner label="Spinner" />
    </View>
  )
}
