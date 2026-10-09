import { Fragment, type KeyboardEvent } from 'react'
import { Check, FileIcon, Folder } from 'lucide-react'
import {
  cn,
  ContactValueLine,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  Input,
  ItemListContent,
  ItemListItem,
  ItemListMenu,
  ItemListStatus,
  itemListRowActiveClassName,
  itemListRowBodyClassName,
  itemListThumbClassName,
  normalizeHexColor,
  RemainingTime,
  StatusTag,
  TagChip,
} from '@webonone/ui-kit'
import type { AppListShowcaseEntry } from '@/pages/pages/appListShowcaseEntries'
export {
  APP_LIST_SHOWCASE_ENTRIES,
  SHOWCASE_LIST_ITEMS,
  type AppListShowcaseEntry,
  type ShowcaseListItem,
  type ShowcaseService,
} from '@/pages/pages/appListShowcaseEntries'

const REMAINING_TIME_NOW = new Date('2026-08-20T12:00:00')
const THEME_SWATCHES = ['#0f172a', '#2563eb', '#22c55e', '#f59e0b', '#ef4444']

export function ShowcaseStandardMenu({ name }: { name: string }) {
  return (
    <ItemListMenu ariaLabel={`Actions for ${name}`}>
      <DropdownMenuItem>View details</DropdownMenuItem>
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
    </ItemListMenu>
  )
}

export function AppListShowcaseSourceLabel({ entry }: { entry: AppListShowcaseEntry }) {
  return (
    <li className="list-none pt-4 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="text-xs font-semibold tracking-wide text-foreground">{entry.source}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{entry.component}</p>
      </div>
    </li>
  )
}

type AppListShowcaseRowProps = {
  entry: AppListShowcaseEntry
  pickerSelectedId: string | null
  onPickerSelect: (id: string) => void
  onDetailOpen: (label: string) => void
}

export function AppListShowcaseRow({
  entry,
  pickerSelectedId,
  onPickerSelect,
  onDetailOpen,
}: AppListShowcaseRowProps) {
  const isPicker =
    entry.variant === 'data-tag-picker' || entry.variant === 'identity-user-picker'
  const isPickerSelected = isPicker && pickerSelectedId === entry.id

  const pickerProps = isPicker
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': `Select ${entry.source}`,
        'aria-pressed': isPickerSelected,
        onClick: () => onPickerSelect(entry.id),
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onPickerSelect(entry.id)
          }
        },
      }
    : {}

  const rowClassName = cn(
    isPickerSelected && itemListRowActiveClassName,
    entry.variant === 'webonone-theme' && itemListRowActiveClassName,
    entry.variant === 'media-file' && itemListRowActiveClassName,
    isPicker && 'cursor-pointer transition-colors',
  )

  return (
    <ItemListItem className={rowClassName} {...pickerProps}>
      <AppListShowcaseRowBody
        entry={entry}
        onDetailOpen={onDetailOpen}
        isPickerSelected={isPickerSelected}
      />
    </ItemListItem>
  )
}

function AppListShowcaseRowBody({
  entry,
  onDetailOpen,
  isPickerSelected,
}: {
  entry: AppListShowcaseEntry
  onDetailOpen: (label: string) => void
  isPickerSelected: boolean
}) {
  switch (entry.variant) {
    case 'data-catalog': {
      const catalog = showcaseCatalogDummy(entry.id)
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen(catalog.name)}
            >
              <ImagePreview
                src="https://placehold.co/112x112/1e293b/f8fafc/png?text=IMG"
                alt=""
                mode="view"
                className={itemListThumbClassName}
              />
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
            </button>
          </ItemListContent>
          <ItemListStatus>
            <StatusTag variant="verified">Verified</StatusTag>
          </ItemListStatus>
          <ShowcaseStandardMenu name={catalog.name} />
        </>
      )
    }
    case 'data-tag':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Pediatrics')}
            >
              <div className="flex items-center gap-2">
                <p className="inline-flex items-center gap-0.5 font-medium">
                  <span style={{ color: normalizeHexColor('#7c3aed') }} aria-hidden>#</span>
                  <span>Pediatrics</span>
                </p>
                <span className="text-xs text-muted-foreground">12 refs</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">Care for infants and children.</p>
            </button>
          </ItemListContent>
          <ItemListStatus>
            <StatusTag variant="pending">Pending</StatusTag>
          </ItemListStatus>
          <ShowcaseStandardMenu name="Pediatrics" />
        </>
      )
    case 'data-unit':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Kilogram')}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">Kilogram (kg)</p>
                <span className="text-xs text-muted-foreground">8 refs</span>
              </div>
              <p className="text-xs text-muted-foreground">Base unit for mass</p>
            </button>
          </ItemListContent>
          <ItemListStatus>
            <StatusTag variant="verified">Verified</StatusTag>
          </ItemListStatus>
          <ShowcaseStandardMenu name="Kilogram" />
        </>
      )
    case 'data-attribute':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Weight')}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">Weight</p>
                <span className="text-xs text-muted-foreground">5 refs</span>
              </div>
              <p className="text-xs text-muted-foreground">Number · Kilogram (kg)</p>
            </button>
          </ItemListContent>
          <ItemListStatus>
            <StatusTag variant="verified">Verified</StatusTag>
          </ItemListStatus>
          <ShowcaseStandardMenu name="Weight" />
        </>
      )
    case 'data-tag-picker':
      return (
        <>
          <ItemListContent>
            <p className="font-medium">Wellness</p>
            <p className="text-xs text-muted-foreground">Tap row to select in picker dialog</p>
          </ItemListContent>
          {isPickerSelected ? (
            <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
          ) : null}
        </>
      )
    case 'identity-user':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className={`${itemListRowBodyClassName} w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              onClick={() => onDetailOpen('Alex Morgan')}
            >
              <ImagePreview
                src={null}
                alt="Alex Morgan"
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">Alex Morgan</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <ContactValueLine kind="email" value="alex@example.com" emptyLabel="Email" />
                  <StatusTag className="shrink-0" variant="verified" />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <ContactValueLine kind="phone" value="+94 77 123 4567" />
                  <StatusTag className="shrink-0" variant="unverified" />
                </div>
              </div>
              <StatusTag variant="company_admin" className="shrink-0 self-start">
                Company admin
              </StatusTag>
            </button>
          </ItemListContent>
          <ShowcaseStandardMenu name="Alex Morgan" />
        </>
      )
    case 'identity-user-picker':
      return (
        <>
          <ItemListContent>
            <div className="flex w-full items-start gap-3">
              <ImagePreview
                src={null}
                alt="Jamie Lee"
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0">
                <p className="font-medium">Jamie Lee</p>
                <ContactValueLine kind="email" value="jamie@example.com" emptyLabel="Email" />
              </div>
            </div>
          </ItemListContent>
          {isPickerSelected ? (
            <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
          ) : null}
        </>
      )
    case 'webonone-staff':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Maya Perera')}
            >
              <ImagePreview
                src={null}
                alt="Maya Perera"
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">Maya Perera</p>
                <ContactValueLine kind="email" value="maya@acme.lk" emptyLabel="Email" />
                <p className="truncate text-xs text-muted-foreground">Mon–Fri · 09:00–17:00</p>
              </div>
            </button>
          </ItemListContent>
          <ShowcaseStandardMenu name="Maya Perera" />
        </>
      )
    case 'webonone-staff-leave':
      return (
        <>
          <ItemListContent>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Annual leave</p>
                <StatusTag variant="pending">Pending</StatusTag>
              </div>
              <p className="text-xs text-muted-foreground">Oct 10, 2026 – Oct 12, 2026</p>
              <p className="text-xs text-muted-foreground">Requested by Maya Perera</p>
            </div>
          </ItemListContent>
          <ItemListMenu ariaLabel="Leave request actions">
            <DropdownMenuItem>Approve</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">Reject</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'webonone-sales-history':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('BILL-1042')}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">BILL-1042</p>
                  <p className="text-xs text-muted-foreground">
                    Walk-in customer · LKR 4,500.00 · Cash
                  </p>
                  <p className="text-xs text-muted-foreground">Oct 10, 2026, 3:45 PM</p>
                </div>
                <StatusTag variant="verified">Completed</StatusTag>
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel="Sale actions">
            <DropdownMenuItem>View bill</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'webonone-pos-cart':
      return (
        <>
          <ItemListContent>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <ImagePreview
                  src={null}
                  alt="Herbal shampoo"
                  mode="view"
                  className={itemListThumbClassName}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Herbal shampoo</p>
                  <p className="text-xs text-muted-foreground">500 ml bottle</p>
                  <p className="text-xs text-muted-foreground">Product</p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  Qty
                  <Input className="h-8 w-16" value="2" readOnly aria-readonly />
                </label>
                <p className="text-sm font-medium">LKR 1,800.00</p>
              </div>
            </div>
          </ItemListContent>
          <ItemListMenu ariaLabel="Cart line actions">
            <DropdownMenuItem className="text-destructive focus:text-destructive">Remove</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'webonone-company-catalog': {
      const label = entry.id.includes('service') ? 'Dental cleaning' : 'Herbal shampoo'
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen(label)}
            >
              <ImagePreview
                src="https://placehold.co/112x112/1e293b/f8fafc/png?text=IMG"
                alt=""
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{label}</span>
                  <StatusTag variant="verified">Linked</StatusTag>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Company catalog row with binding mode chip.
                </p>
              </div>
            </button>
          </ItemListContent>
          <ShowcaseStandardMenu name={label} />
        </>
      )
    }
    case 'webonone-calendar-event':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Dental cleaning')}
            >
              <ImagePreview
                src={null}
                alt="Dental cleaning"
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">Dental cleaning</p>
                <p className="text-xs text-muted-foreground">Maya Perera · Oct 10, 2026</p>
              </div>
            </button>
          </ItemListContent>
          <ShowcaseStandardMenu name="Dental cleaning" />
        </>
      )
    case 'webonone-calendar-session':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Session')}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">Morning session</p>
                <p className="text-xs text-muted-foreground">09:00 – 10:00 · Room A</p>
              </div>
            </button>
          </ItemListContent>
          <RemainingTime
            start="2026-08-20T12:12:00"
            end="2026-08-20T13:00:00"
            now={REMAINING_TIME_NOW}
            labels={{ due: 'Due' }}
          />
          <ShowcaseStandardMenu name="Morning session" />
        </>
      )
    case 'webonone-dashboard-event':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Yoga')}
            >
              <ImagePreview src={null} alt="Yoga" mode="view" className={itemListThumbClassName} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">Yoga class</p>
                <p className="text-xs text-muted-foreground">Staff: Maya · Attendee: Sam</p>
              </div>
            </button>
          </ItemListContent>
          <StatusTag variant="pending" className="shrink-0 self-start">Scheduled</StatusTag>
          <RemainingTime
            start="2026-08-20T12:12:00"
            end="2026-08-20T13:00:00"
            now={REMAINING_TIME_NOW}
            labels={{ due: 'Due' }}
          />
        </>
      )
    case 'webonone-theme':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Ocean')}
            >
              <p className="font-medium">Ocean</p>
              <p className="text-xs text-muted-foreground">Custom theme</p>
              <div className="mt-2 flex gap-1">
                {THEME_SWATCHES.map((color) => (
                  <span
                    key={color}
                    className="h-6 w-6 rounded border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel="Theme actions">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem disabled>Active</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'webonone-companies':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Acme Corp')}
            >
              <ImagePreview
                src="https://placehold.co/112x112/1e293b/f8fafc/png?text=AC"
                alt="Acme Corp"
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0 space-y-1">
                <p className="font-medium">Acme Corp</p>
                <StatusTag variant="verified">Approved</StatusTag>
                <p className="text-xs text-muted-foreground">Oct 10, 2026</p>
              </div>
            </button>
          </ItemListContent>
          <ShowcaseStandardMenu name="Acme Corp" />
        </>
      )
    case 'webonone-my-companies':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Acme Corp')}
            >
              <ImagePreview
                src={null}
                alt="Acme Corp"
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">Acme Corp</p>
                  <StatusTag variant="verified">Approved</StatusTag>
                  <StatusTag variant="company_admin">Company admin</StatusTag>
                </div>
                <p className="text-xs text-muted-foreground">Oct 10, 2026</p>
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel="Company actions">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Log in as owner</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'webonone-notifications':
      return (
        <ItemListContent>
          <button
            type="button"
            className="flex w-full flex-col gap-0.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onDetailOpen('Notification')}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">Invoice ready</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">2h ago</span>
            </div>
            <span className="line-clamp-2 text-xs text-muted-foreground">
              Your October subscription invoice is available to review.
            </span>
          </button>
        </ItemListContent>
      )
    case 'email-template':
    case 'sms-template':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Welcome email')}
            >
              <p className="font-medium">Welcome email</p>
              <p className="text-xs text-muted-foreground">
                welcome · Company · Active · Oct 10, 2026, 3:45 PM
              </p>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel="Template actions">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Preview</DropdownMenuItem>
            <DropdownMenuItem>Deactivate</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'email-history':
    case 'sms-history':
      return (
        <>
          <ItemListContent>
            <p className="font-medium">customer@example.com</p>
            <p className="text-xs text-muted-foreground">
              welcome · Sent · Oct 10, 2026, 3:45 PM
            </p>
          </ItemListContent>
          <ItemListMenu ariaLabel="History row actions">
            <DropdownMenuItem disabled>Sent</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'email-queue':
    case 'sms-queue':
      return (
        <>
          <ItemListContent>
            <p className="font-medium">customer@example.com</p>
            <p className="text-xs text-muted-foreground">
              welcome · Pending · 2 attempts · Oct 10, 2026, 3:45 PM
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-destructive">SMTP connection timed out</p>
          </ItemListContent>
          <ItemListMenu ariaLabel="Queue row actions">
            <DropdownMenuItem disabled>Failed</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Retry</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'sms-device':
      return (
        <>
          <ItemListContent>
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
          </ItemListContent>
          <ItemListMenu ariaLabel="Device actions">
            <DropdownMenuItem disabled>Approved</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">Revoke</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'design-form':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Patient intake')}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">Patient intake</p>
                <StatusTag variant="approved">Published</StatusTag>
              </div>
              <p className="text-sm text-muted-foreground">patient-intake · 12 fields</p>
            </button>
          </ItemListContent>
          <ShowcaseStandardMenu name="Patient intake" />
        </>
      )
    case 'design-website-page':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Home')}
            >
              <p className="font-medium">Home</p>
              <p className="text-xs text-muted-foreground">/ · Published · Oct 10, 2026</p>
            </button>
          </ItemListContent>
          <ShowcaseStandardMenu name="Home" />
        </>
      )
    case 'payment-invoice':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onDetailOpen('Acme Corp')}
            >
              <div className="flex items-start gap-3">
                <ImagePreview
                  src={null}
                  alt="Acme Corp"
                  mode="view"
                  className={itemListThumbClassName}
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">Acme Corp</p>
                    <StatusTag variant="pending">Issued</StatusTag>
                  </div>
                  <p className="text-xs text-muted-foreground">INV-2026-10 · REF-8842</p>
                  <p className="text-xs text-muted-foreground">Oct 1, 2026 – Oct 31, 2026</p>
                  <p className="text-sm">LKR 3,000.00 · Due Oct 10, 2026</p>
                </div>
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel="Invoice actions">
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>Mark paid</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'ai-conversation':
      return (
        <ItemListContent>
          <button
            type="button"
            className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onDetailOpen('Catalog assistant')}
          >
            <p className="font-medium">Catalog assistant</p>
            <p className="text-sm text-muted-foreground">Oct 10, 2026, 3:45 PM</p>
          </button>
        </ItemListContent>
      )
    case 'media-folder':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-center gap-2 text-left text-sm"
              onClick={() => onDetailOpen('Marketing')}
            >
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate font-medium">Marketing</span>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel="Folder actions">
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    case 'media-file':
      return (
        <>
          <ItemListContent>
            <button
              type="button"
              className="flex w-full items-start gap-2 text-left text-sm"
              onClick={() => onDetailOpen('hero-banner.jpg')}
            >
              <FileIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">hero-banner.jpg</span>
                <span className="text-xs text-muted-foreground">1.2 MB · Oct 10, 2026</span>
              </span>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel="File actions">
            <DropdownMenuItem>Download</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
          </ItemListMenu>
        </>
      )
    default:
      return (
        <ItemListContent>
          <p className="text-sm text-muted-foreground">Unknown list variant</p>
        </ItemListContent>
      )
  }
}

export function showcaseCatalogDummy(id: string) {
  if (id === 'data-services') {
    return { name: 'Dental cleaning', description: '60-minute hygiene appointment.' }
  }
  if (id === 'data-spaces') {
    return { name: 'Consultation room A', description: 'Ground floor · seats 4.' }
  }
  return { name: 'Wireless keyboard', description: 'Compact layout with USB receiver.' }
}

/** @deprecated Use AppListShowcaseRow with AppListShowcaseSourceLabel */
export function ListItemShowcaseRow(props: AppListShowcaseRowProps) {
  return <AppListShowcaseRow {...props} />
}

export function AppListShowcaseRows({
  entries,
  pickerSelectedId,
  onPickerSelect,
  onDetailOpen,
}: {
  entries: AppListShowcaseEntry[]
  pickerSelectedId: string | null
  onPickerSelect: (id: string) => void
  onDetailOpen: (label: string) => void
}) {
  return (
    <>
      {entries.map((entry) => (
        <Fragment key={entry.id}>
          <AppListShowcaseSourceLabel entry={entry} />
          <AppListShowcaseRow
            entry={entry}
            pickerSelectedId={pickerSelectedId}
            onPickerSelect={onPickerSelect}
            onDetailOpen={onDetailOpen}
          />
        </Fragment>
      ))}
    </>
  )
}
