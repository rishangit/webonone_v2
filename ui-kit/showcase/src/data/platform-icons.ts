import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Circle,
  Eye,
  EyeOff,
  Home,
  Image,
  Info,
  Lock,
  LogOut,
  Mail,
  Menu,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Tag,
  Tags,
  Trash2,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'

export type PlatformIconCategory = 'action' | 'navigation' | 'form' | 'selection' | 'media' | 'chrome'

export interface PlatformIconDefinition {
  /** Lucide export name (PascalCase). */
  name: string
  icon: LucideIcon
  category: PlatformIconCategory
  /** Components or showcase demos that use this icon today. */
  usedIn: string[]
}

export const PLATFORM_ICON_CATEGORIES: { id: PlatformIconCategory; label: string; description: string }[] = [
  { id: 'action', label: 'Actions', description: 'Buttons, dialogs, and destructive flows' },
  { id: 'navigation', label: 'Navigation', description: 'Menus, shells, and directional affordances' },
  { id: 'form', label: 'Form & input', description: 'Field icons and input-group leading icons' },
  { id: 'selection', label: 'Selection', description: 'Checks, carets, and picker indicators' },
  { id: 'media', label: 'Media', description: 'Content and asset affordances' },
  { id: 'chrome', label: 'App chrome', description: 'Header, overflow, and dismiss controls' },
]

/** Canonical list of Lucide icons used by @webonone/ui-kit and the showcase (1.3.0). */
export const PLATFORM_ICONS: PlatformIconDefinition[] = [
  {
    name: 'ArrowRight',
    icon: ArrowRight,
    category: 'navigation',
    usedIn: ['Showcase — Buttons with icons'],
  },
  {
    name: 'Calendar',
    icon: Calendar,
    category: 'form',
    usedIn: ['DatePicker', 'FullCalendar'],
  },
  {
    name: 'Check',
    icon: Check,
    category: 'selection',
    usedIn: ['Checkbox', 'Select', 'MultiSelect', 'DropdownMenu', 'PhoneCountrySelect'],
  },
  {
    name: 'ChevronDown',
    icon: ChevronDown,
    category: 'selection',
    usedIn: ['Select', 'PhoneCountrySelect', 'NavGroup'],
  },
  {
    name: 'ChevronLeft',
    icon: ChevronLeft,
    category: 'navigation',
    usedIn: ['Calendar', 'FullCalendar'],
  },
  {
    name: 'ChevronRight',
    icon: ChevronRight,
    category: 'navigation',
    usedIn: ['Calendar', 'FullCalendar', 'DropdownMenuSubTrigger'],
  },
  {
    name: 'ChevronUp',
    icon: ChevronUp,
    category: 'selection',
    usedIn: ['Select'],
  },
  {
    name: 'ChevronsUpDown',
    icon: ChevronsUpDown,
    category: 'selection',
    usedIn: ['MultiSelect'],
  },
  {
    name: 'Circle',
    icon: Circle,
    category: 'selection',
    usedIn: ['DropdownMenuRadioItem'],
  },
  {
    name: 'Eye',
    icon: Eye,
    category: 'form',
    usedIn: ['PasswordInput'],
  },
  {
    name: 'EyeOff',
    icon: EyeOff,
    category: 'form',
    usedIn: ['PasswordInput'],
  },
  {
    name: 'Home',
    icon: Home,
    category: 'navigation',
    usedIn: ['Showcase — AppShell nav'],
  },
  {
    name: 'Image',
    icon: Image,
    category: 'media',
    usedIn: ['Showcase — AppShell nav'],
  },
  {
    name: 'Info',
    icon: Info,
    category: 'action',
    usedIn: ['FullCalendar'],
  },
  {
    name: 'Lock',
    icon: Lock,
    category: 'form',
    usedIn: ['PasswordInput'],
  },
  {
    name: 'LogOut',
    icon: LogOut,
    category: 'action',
    usedIn: ['AppHeader'],
  },
  {
    name: 'Mail',
    icon: Mail,
    category: 'form',
    usedIn: ['Showcase — Email input with icon'],
  },
  {
    name: 'Menu',
    icon: Menu,
    category: 'chrome',
    usedIn: ['AppHeader'],
  },
  {
    name: 'MoreVertical',
    icon: MoreVertical,
    category: 'chrome',
    usedIn: ['ItemListMenu', 'Showcase — 3-dot menu'],
  },
  {
    name: 'PanelLeftClose',
    icon: PanelLeftClose,
    category: 'navigation',
    usedIn: ['SidebarCollapseButton'],
  },
  {
    name: 'PanelLeftOpen',
    icon: PanelLeftOpen,
    category: 'navigation',
    usedIn: ['SidebarCollapseButton'],
  },
  {
    name: 'Palette',
    icon: Palette,
    category: 'media',
    usedIn: ['Showcase — AppShell nav'],
  },
  {
    name: 'Phone',
    icon: Phone,
    category: 'form',
    usedIn: ['PhoneInput'],
  },
  {
    name: 'Plus',
    icon: Plus,
    category: 'action',
    usedIn: ['Showcase — Buttons with icons'],
  },
  {
    name: 'RefreshCw',
    icon: RefreshCw,
    category: 'action',
    usedIn: ['Showcase — Buttons with icons'],
  },
  {
    name: 'Save',
    icon: Save,
    category: 'action',
    usedIn: ['Showcase — CustomDialog form'],
  },
  {
    name: 'Search',
    icon: Search,
    category: 'form',
    usedIn: ['Showcase — Input with icon'],
  },
  {
    name: 'Settings',
    icon: Settings,
    category: 'chrome',
    usedIn: ['Showcase — AppShell nav'],
  },
  {
    name: 'Tag',
    icon: Tag,
    category: 'media',
    usedIn: ['Showcase — CustomDialog form'],
  },
  {
    name: 'Tags',
    icon: Tags,
    category: 'form',
    usedIn: ['Showcase — MultiSelect with icon'],
  },
  {
    name: 'Trash2',
    icon: Trash2,
    category: 'action',
    usedIn: ['Showcase — Delete dialog'],
  },
  {
    name: 'User',
    icon: User,
    category: 'form',
    usedIn: ['AppHeader', 'Showcase — Select with icon'],
  },
  {
    name: 'X',
    icon: X,
    category: 'chrome',
    usedIn: ['Dialog', 'CustomDialog', 'MultiSelect', 'AppHeader'],
  },
]
