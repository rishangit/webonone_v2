import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Eye,
  EyeOff,
  Home,
  Image,
  Mail,
  Menu,
  MoreVertical,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tag,
  Trash2,
  User,
  X,
  type LucideIcon,
} from 'lucide-react-native'

export type PlatformIconCategory = 'action' | 'navigation' | 'form' | 'selection' | 'media' | 'chrome'

export const PLATFORM_ICON_CATEGORIES: { id: PlatformIconCategory; label: string; description: string }[] = [
  { id: 'action', label: 'Actions', description: 'Buttons, dialogs, and destructive flows' },
  { id: 'navigation', label: 'Navigation', description: 'Menus, shells, and directional affordances' },
  { id: 'form', label: 'Form & input', description: 'Field icons and leading icons' },
  { id: 'selection', label: 'Selection', description: 'Checks, carets, and picker indicators' },
  { id: 'media', label: 'Media', description: 'Content and asset affordances' },
  { id: 'chrome', label: 'App chrome', description: 'Header, overflow, and dismiss controls' },
]

export const PLATFORM_ICONS: {
  name: string
  icon: LucideIcon
  category: PlatformIconCategory
  usedIn: string[]
}[] = [
  { name: 'Plus', icon: Plus, category: 'action', usedIn: ['Button', 'ListAddButton'] },
  { name: 'Trash2', icon: Trash2, category: 'action', usedIn: ['ItemListMenu'] },
  { name: 'RefreshCw', icon: RefreshCw, category: 'action', usedIn: ['Icon button'] },
  { name: 'ArrowRight', icon: ArrowRight, category: 'navigation', usedIn: ['Buttons with icons'] },
  { name: 'ChevronLeft', icon: ChevronLeft, category: 'navigation', usedIn: ['Back'] },
  { name: 'Home', icon: Home, category: 'navigation', usedIn: ['Drawer'] },
  { name: 'Settings', icon: Settings, category: 'navigation', usedIn: ['Drawer'] },
  { name: 'Search', icon: Search, category: 'form', usedIn: ['SearchInput'] },
  { name: 'Mail', icon: Mail, category: 'form', usedIn: ['TextField'] },
  { name: 'Phone', icon: Phone, category: 'form', usedIn: ['PhoneInput'] },
  { name: 'Calendar', icon: Calendar, category: 'form', usedIn: ['Date fields'] },
  { name: 'Eye', icon: Eye, category: 'form', usedIn: ['PasswordInput'] },
  { name: 'EyeOff', icon: EyeOff, category: 'form', usedIn: ['PasswordInput'] },
  { name: 'User', icon: User, category: 'form', usedIn: ['SelectUser'] },
  { name: 'Check', icon: Check, category: 'selection', usedIn: ['Checkbox', 'Select'] },
  { name: 'ChevronDown', icon: ChevronDown, category: 'selection', usedIn: ['Select', 'SelectUser'] },
  { name: 'Tag', icon: Tag, category: 'selection', usedIn: ['SelectTag'] },
  { name: 'Image', icon: Image, category: 'media', usedIn: ['SelectMedia', 'ImagePreview'] },
  { name: 'Palette', icon: Palette, category: 'media', usedIn: ['ColorInput'] },
  { name: 'Menu', icon: Menu, category: 'chrome', usedIn: ['AppHeader'] },
  { name: 'MoreVertical', icon: MoreVertical, category: 'chrome', usedIn: ['ItemListMenu'] },
  { name: 'X', icon: X, category: 'chrome', usedIn: ['CustomDialog'] },
]
