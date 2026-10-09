import { Folder } from 'lucide-react'
import {
  ContactValueLine,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  Input,
  ItemListCollectionCard,
  ItemListMenu,
  ItemListStatus,
  itemListCardImageClassName,
  ItemListCardPlaceholderImage,
  itemListRowActiveClassName,
  RemainingTime,
  StatusTag,
  TagChip,
} from '@webonone/ui-kit'
import type { AppListShowcaseEntry } from '@/pages/pages/appListShowcaseEntries'
import { ShowcaseStandardMenu, showcaseCatalogDummy } from '@/pages/pages/listItemShowcase'

const REMAINING_TIME_NOW = new Date('2026-08-20T12:00:00')
const THEME_SWATCHES = ['#0f172a', '#2563eb', '#22c55e', '#f59e0b', '#ef4444']
const CATALOG_IMAGE = 'https://placehold.co/800x600/1e293b/f8fafc/png?text=IMG'
const COMPANY_LOGO = 'https://placehold.co/800x600/1e293b/f8fafc/png?text=AC'

function themeStripeImage() {
  return (
    <div className="flex h-full w-full">
      {THEME_SWATCHES.map((color) => (
        <span key={color} className="min-w-0 flex-1" style={{ backgroundColor: color }} title={color} />
      ))}
    </div>
  )
}

function folderHero() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/40">
      <Folder className="h-10 w-10 text-muted-foreground" aria-hidden />
    </div>
  )
}

function fileHero() {
  return (
    <ImagePreview
      src={CATALOG_IMAGE}
      alt="hero-banner.jpg"
      className={itemListCardImageClassName}
    />
  )
}

export interface AppListShowcaseCardProps {
  entry: AppListShowcaseEntry
  onDetailOpen: (label: string) => void
}

/** Collection card layout mirroring each production `renderCard` pattern. */
export function AppListShowcaseCard({ entry, onDetailOpen }: AppListShowcaseCardProps) {
  switch (entry.variant) {
    case 'data-catalog': {
      const catalog = showcaseCatalogDummy(entry.id)
      return (
        <ItemListCollectionCard
          image={
            <ImagePreview src={CATALOG_IMAGE} alt="" className={itemListCardImageClassName} />
          }
          menu={<ShowcaseStandardMenu name={catalog.name} />}
          onBodyClick={() => onDetailOpen(catalog.name)}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{catalog.name}</p>
              <span className="text-xs text-muted-foreground">3 refs</span>
            </div>
            <p className="truncate text-xs text-muted-foreground">{catalog.description}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <TagChip name="Featured" color="#2563eb" />
              <TagChip name="Retail" color="#22c55e" />
            </div>
          </div>
          <div className="mt-2">
            <ItemListStatus>
              <StatusTag variant="verified">Verified</StatusTag>
            </ItemListStatus>
          </div>
        </ItemListCollectionCard>
      )
    }
    case 'data-tag':
      return (
        <ItemListCollectionCard
          image={
            <div className="h-full w-full" style={{ backgroundColor: '#7c3aed' }} aria-hidden />
          }
          menu={<ShowcaseStandardMenu name="Pediatrics" />}
          onBodyClick={() => onDetailOpen('Pediatrics')}
        >
          <div className="flex items-center gap-2">
            <p className="inline-flex items-center gap-0.5 font-medium">
              <span style={{ color: '#7c3aed' }} aria-hidden>#</span>
              <span>Pediatrics</span>
            </p>
            <span className="text-xs text-muted-foreground">12 refs</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">Care for infants and children.</p>
          <div className="mt-2">
            <ItemListStatus>
              <StatusTag variant="pending">Pending</StatusTag>
            </ItemListStatus>
          </div>
        </ItemListCollectionCard>
      )
    case 'data-unit':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Kilogram" />}
          menu={<ShowcaseStandardMenu name="Kilogram" />}
          onBodyClick={() => onDetailOpen('Kilogram')}
        >
          <div className="flex items-center gap-2">
            <p className="font-medium">Kilogram (kg)</p>
            <span className="text-xs text-muted-foreground">8 refs</span>
          </div>
          <p className="text-xs text-muted-foreground">Base unit for mass</p>
          <div className="mt-2">
            <ItemListStatus>
              <StatusTag variant="verified">Verified</StatusTag>
            </ItemListStatus>
          </div>
        </ItemListCollectionCard>
      )
    case 'data-attribute':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Weight" />}
          menu={<ShowcaseStandardMenu name="Weight" />}
          onBodyClick={() => onDetailOpen('Weight')}
        >
          <div className="flex items-center gap-2">
            <p className="font-medium">Weight</p>
            <span className="text-xs text-muted-foreground">5 refs</span>
          </div>
          <p className="text-xs text-muted-foreground">Number · Kilogram (kg)</p>
          <div className="mt-2">
            <ItemListStatus>
              <StatusTag variant="verified">Verified</StatusTag>
            </ItemListStatus>
          </div>
        </ItemListCollectionCard>
      )
    case 'data-tag-picker':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Wellness" />}
          onBodyClick={() => onDetailOpen('Wellness')}
        >
          <p className="font-medium">Wellness</p>
          <p className="text-xs text-muted-foreground">Tap row to select in picker dialog</p>
        </ItemListCollectionCard>
      )
    case 'identity-user':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={null} alt="Alex Morgan" className={itemListCardImageClassName} />}
          menu={<ShowcaseStandardMenu name="Alex Morgan" />}
          onBodyClick={() => onDetailOpen('Alex Morgan')}
        >
          <p className="truncate font-medium">Alex Morgan</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ContactValueLine kind="email" value="alex@example.com" emptyLabel="Email" />
            <StatusTag className="shrink-0" variant="verified" />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ContactValueLine kind="phone" value="+94 77 123 4567" />
            <StatusTag className="shrink-0" variant="unverified" />
          </div>
          <StatusTag variant="company_admin" className="mt-2 shrink-0 self-start">
            Company admin
          </StatusTag>
        </ItemListCollectionCard>
      )
    case 'identity-user-picker':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={null} alt="Jamie Lee" className={itemListCardImageClassName} />}
          onBodyClick={() => onDetailOpen('Jamie Lee')}
        >
          <p className="font-medium">Jamie Lee</p>
          <ContactValueLine kind="email" value="jamie@example.com" emptyLabel="Email" />
        </ItemListCollectionCard>
      )
    case 'webonone-staff':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={null} alt="Maya Perera" className={itemListCardImageClassName} />}
          menu={<ShowcaseStandardMenu name="Maya Perera" />}
          onBodyClick={() => onDetailOpen('Maya Perera')}
        >
          <p className="truncate font-medium">Maya Perera</p>
          <ContactValueLine kind="email" value="maya@acme.lk" emptyLabel="Email" />
          <p className="truncate text-xs text-muted-foreground">Mon–Fri · 09:00–17:00</p>
        </ItemListCollectionCard>
      )
    case 'webonone-staff-leave':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Annual leave" />}
          menu={
            <ItemListMenu ariaLabel="Leave request actions">
              <DropdownMenuItem>Approve</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">Reject</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('Annual leave')}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">Annual leave</p>
            <StatusTag variant="pending">Pending</StatusTag>
          </div>
          <p className="text-xs text-muted-foreground">Oct 10, 2026 – Oct 12, 2026</p>
          <p className="text-xs text-muted-foreground">Requested by Maya Perera</p>
        </ItemListCollectionCard>
      )
    case 'webonone-sales-history':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="BILL-1042" />}
          menu={
            <ItemListMenu ariaLabel="Sale actions">
              <DropdownMenuItem>View bill</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('BILL-1042')}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">BILL-1042</p>
              <p className="text-xs text-muted-foreground">Walk-in customer · LKR 4,500.00 · Cash</p>
              <p className="text-xs text-muted-foreground">Oct 10, 2026, 3:45 PM</p>
            </div>
            <StatusTag variant="verified">Completed</StatusTag>
          </div>
        </ItemListCollectionCard>
      )
    case 'webonone-pos-cart':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={null} alt="Herbal shampoo" className={itemListCardImageClassName} />}
          menu={
            <ItemListMenu ariaLabel="Cart line actions">
              <DropdownMenuItem className="text-destructive focus:text-destructive">Remove</DropdownMenuItem>
            </ItemListMenu>
          }
        >
          <p className="text-sm font-medium">Herbal shampoo</p>
          <p className="text-xs text-muted-foreground">500 ml bottle · Product</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Qty
              <Input className="h-8 w-16" value="2" readOnly aria-readonly />
            </label>
            <p className="text-sm font-medium">LKR 1,800.00</p>
          </div>
        </ItemListCollectionCard>
      )
    case 'webonone-company-catalog': {
      const label = entry.id.includes('service') ? 'Dental cleaning' : 'Herbal shampoo'
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={CATALOG_IMAGE} alt="" className={itemListCardImageClassName} />}
          menu={<ShowcaseStandardMenu name={label} />}
          onBodyClick={() => onDetailOpen(label)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{label}</span>
            <StatusTag variant="verified">Linked</StatusTag>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            Company catalog row with binding mode chip.
          </p>
        </ItemListCollectionCard>
      )
    }
    case 'webonone-calendar-event':
      return (
        <ItemListCollectionCard
          image={
            <ImagePreview src={null} alt="Dental cleaning" className={itemListCardImageClassName} />
          }
          menu={<ShowcaseStandardMenu name="Dental cleaning" />}
          onBodyClick={() => onDetailOpen('Dental cleaning')}
        >
          <p className="truncate font-medium">Dental cleaning</p>
          <p className="text-xs text-muted-foreground">Maya Perera · Oct 10, 2026</p>
        </ItemListCollectionCard>
      )
    case 'webonone-calendar-session':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Morning session" />}
          menu={<ShowcaseStandardMenu name="Morning session" />}
          onBodyClick={() => onDetailOpen('Session')}
        >
          <p className="font-medium">Morning session</p>
          <p className="text-xs text-muted-foreground">09:00 – 10:00 · Room A</p>
          <RemainingTime
            className="mt-2"
            start="2026-08-20T12:12:00"
            end="2026-08-20T13:00:00"
            now={REMAINING_TIME_NOW}
            labels={{ due: 'Due' }}
          />
        </ItemListCollectionCard>
      )
    case 'webonone-dashboard-event':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={null} alt="Yoga" className={itemListCardImageClassName} />}
          onBodyClick={() => onDetailOpen('Yoga')}
        >
          <p className="truncate font-medium">Yoga class</p>
          <p className="text-xs text-muted-foreground">Staff: Maya · Attendee: Sam</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusTag variant="pending">Scheduled</StatusTag>
            <RemainingTime
              start="2026-08-20T12:12:00"
              end="2026-08-20T13:00:00"
              now={REMAINING_TIME_NOW}
              labels={{ due: 'Due' }}
            />
          </div>
        </ItemListCollectionCard>
      )
    case 'webonone-theme':
      return (
        <ItemListCollectionCard
          className={itemListRowActiveClassName}
          image={themeStripeImage()}
          menu={
            <ItemListMenu ariaLabel="Theme actions">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem disabled>Active</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('Ocean')}
        >
          <p className="font-medium">Ocean</p>
          <p className="text-xs text-muted-foreground">Custom theme</p>
        </ItemListCollectionCard>
      )
    case 'webonone-companies':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={COMPANY_LOGO} alt="Acme Corp" className={itemListCardImageClassName} />}
          menu={<ShowcaseStandardMenu name="Acme Corp" />}
          onBodyClick={() => onDetailOpen('Acme Corp')}
        >
          <p className="font-medium">Acme Corp</p>
          <StatusTag variant="verified">Approved</StatusTag>
          <p className="text-xs text-muted-foreground">Oct 10, 2026</p>
        </ItemListCollectionCard>
      )
    case 'webonone-my-companies':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={null} alt="Acme Corp" className={itemListCardImageClassName} />}
          menu={
            <ItemListMenu ariaLabel="Company actions">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Log in as owner</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('Acme Corp')}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">Acme Corp</p>
            <StatusTag variant="verified">Approved</StatusTag>
            <StatusTag variant="company_admin">Company admin</StatusTag>
          </div>
          <p className="text-xs text-muted-foreground">Oct 10, 2026</p>
        </ItemListCollectionCard>
      )
    case 'webonone-notifications':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Invoice ready" />}
          onBodyClick={() => onDetailOpen('Notification')}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">Invoice ready</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">2h ago</span>
          </div>
          <span className="line-clamp-2 text-xs text-muted-foreground">
            Your October subscription invoice is available to review.
          </span>
        </ItemListCollectionCard>
      )
    case 'email-template':
    case 'sms-template':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Welcome email" />}
          menu={
            <ItemListMenu ariaLabel="Template actions">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Preview</DropdownMenuItem>
              <DropdownMenuItem>Deactivate</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('Welcome email')}
        >
          <p className="font-medium">Welcome email</p>
          <p className="text-xs text-muted-foreground">
            welcome · Company · Active · Oct 10, 2026, 3:45 PM
          </p>
        </ItemListCollectionCard>
      )
    case 'email-history':
    case 'sms-history':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage />}
          menu={
            <ItemListMenu ariaLabel="History row actions">
              <DropdownMenuItem disabled>Sent</DropdownMenuItem>
            </ItemListMenu>
          }
        >
          <p className="font-medium">customer@example.com</p>
          <p className="text-xs text-muted-foreground">welcome · Sent · Oct 10, 2026, 3:45 PM</p>
        </ItemListCollectionCard>
      )
    case 'email-queue':
    case 'sms-queue':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage />}
          menu={
            <ItemListMenu ariaLabel="Queue row actions">
              <DropdownMenuItem disabled>Failed</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Retry</DropdownMenuItem>
            </ItemListMenu>
          }
        >
          <p className="font-medium">customer@example.com</p>
          <p className="text-xs text-muted-foreground">
            welcome · Pending · 2 attempts · Oct 10, 2026, 3:45 PM
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-destructive">SMTP connection timed out</p>
        </ItemListCollectionCard>
      )
    case 'sms-device':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Pixel gateway" />}
          menu={
            <ItemListMenu ariaLabel="Device actions">
              <DropdownMenuItem disabled>Approved</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">Revoke</DropdownMenuItem>
            </ItemListMenu>
          }
        >
          <p className="font-medium">
            Pixel gateway
            <span
              className="ml-2 inline-block h-2 w-2 rounded-full bg-green-500"
              aria-label="Online"
            />
          </p>
          <p className="text-xs text-muted-foreground">
            Company · Approved · Online · Last seen Oct 10, 2026, 3:45 PM · v1.2.0
          </p>
        </ItemListCollectionCard>
      )
    case 'design-form':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Patient intake" />}
          menu={<ShowcaseStandardMenu name="Patient intake" />}
          onBodyClick={() => onDetailOpen('Patient intake')}
        >
          <div className="flex items-center gap-2">
            <p className="font-medium">Patient intake</p>
            <StatusTag variant="approved">Published</StatusTag>
          </div>
          <p className="text-sm text-muted-foreground">patient-intake · 12 fields</p>
        </ItemListCollectionCard>
      )
    case 'design-website-page':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Home" />}
          menu={<ShowcaseStandardMenu name="Home" />}
          onBodyClick={() => onDetailOpen('Home')}
        >
          <p className="font-medium">Home</p>
          <p className="text-xs text-muted-foreground">/ · Published · Oct 10, 2026</p>
        </ItemListCollectionCard>
      )
    case 'payment-invoice':
      return (
        <ItemListCollectionCard
          image={<ImagePreview src={null} alt="Acme Corp" className={itemListCardImageClassName} />}
          menu={
            <ItemListMenu ariaLabel="Invoice actions">
              <DropdownMenuItem>View</DropdownMenuItem>
              <DropdownMenuItem>Mark paid</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('Acme Corp')}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">Acme Corp</p>
            <StatusTag variant="pending">Issued</StatusTag>
          </div>
          <p className="text-xs text-muted-foreground">INV-2026-10 · REF-8842</p>
          <p className="text-xs text-muted-foreground">Oct 1, 2026 – Oct 31, 2026</p>
          <p className="text-sm">LKR 3,000.00 · Due Oct 10, 2026</p>
        </ItemListCollectionCard>
      )
    case 'ai-conversation':
      return (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt="Catalog assistant" />}
          onBodyClick={() => onDetailOpen('Catalog assistant')}
        >
          <p className="font-medium">Catalog assistant</p>
          <p className="text-sm text-muted-foreground">Oct 10, 2026, 3:45 PM</p>
        </ItemListCollectionCard>
      )
    case 'media-folder':
      return (
        <ItemListCollectionCard
          image={folderHero()}
          menu={
            <ItemListMenu ariaLabel="Folder actions">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('Marketing')}
        >
          <p className="truncate font-medium">Marketing</p>
          <p className="text-xs text-muted-foreground">Folder</p>
        </ItemListCollectionCard>
      )
    case 'media-file':
      return (
        <ItemListCollectionCard
          image={fileHero()}
          menu={
            <ItemListMenu ariaLabel="File actions">
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
            </ItemListMenu>
          }
          onBodyClick={() => onDetailOpen('hero-banner.jpg')}
        >
          <p className="truncate font-medium">hero-banner.jpg</p>
          <p className="text-xs text-muted-foreground">1.2 MB · Oct 10, 2026</p>
        </ItemListCollectionCard>
      )
    default:
      return (
        <ItemListCollectionCard image={<ItemListCardPlaceholderImage alt={entry.source} />}>
          <p className="text-sm text-muted-foreground">Unknown list variant</p>
        </ItemListCollectionCard>
      )
  }
}
