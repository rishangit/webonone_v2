import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Menu as MenuIcon, Plus, Trash2, X } from 'lucide-react'
import {
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { resolveTextStyle } from '../../document/theme'
import { emptyLayoutByBreakpoint } from '../../types'
import type { MenuItem, WebsiteAddon, WebsiteTextStyle, WebsiteTheme } from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'
import { publicPageHref } from '../../utils/companyPublicHost'
import {
  addSubItem,
  createMenuItem,
  moveMenuItem,
  removeMenuItem,
  resolveMenuSettings,
  updateMenuBreakpointSettings,
  updateMenuItem,
} from './menuItemUtils'

const PLACEHOLDER_ITEMS: MenuItem[] = [
  {
    id: 'preview-1',
    label: 'Home',
    textStyleId: '',
    linkPageId: null,
    children: [],
  },
  {
    id: 'preview-2',
    label: 'Services',
    textStyleId: '',
    linkPageId: null,
    children: [{ id: 'preview-2a', label: 'Consulting', textStyleId: '', linkPageId: null, children: [] }],
  },
]

function alignClass(align: 'start' | 'center' | 'end'): string {
  if (align === 'start') return 'justify-start'
  if (align === 'center') return 'justify-center'
  return 'justify-end'
}

function itemLinkStyle(
  theme: WebsiteTheme | null | undefined,
  textStyleId: string,
  breakpoint: AddonRenderProps['breakpoint'],
): CSSProperties {
  const style = theme?.textStyles.find((item) => item.id === textStyleId)
  const snap = resolveTextStyle(theme ?? null, style, breakpoint)
  return {
    fontFamily: snap.fontFamily,
    fontSize: snap.size,
    color: snap.color,
  }
}

type MenuLinkContext = {
  theme?: WebsiteTheme | null
  breakpoint: AddonRenderProps['breakpoint']
  pages: AddonRenderProps['pages']
  currentPageId?: string | null
  companyId?: string
  interactive: boolean
  publish: boolean
  onNavigatePage?: (path: string) => void
}

function resolvePagePath(pages: MenuLinkContext['pages'], pageId: string | null): string | undefined {
  if (!pageId) return undefined
  return pages?.find((page) => page.id === pageId)?.path
}

function MenuLink({
  item,
  className,
  stacked = false,
  context,
}: {
  item: MenuItem
  className?: string
  stacked?: boolean
  context: MenuLinkContext
}) {
  const path = resolvePagePath(context.pages, item.linkPageId)
  const current = Boolean(path && context.currentPageId && context.pages?.find((p) => p.id === context.currentPageId)?.path === path)
  const href = context.publish && path && context.companyId ? publicPageHref(context.companyId, path) : undefined
  const style = itemLinkStyle(context.theme, item.textStyleId, context.breakpoint)
  const canNavigate = !context.interactive && Boolean(path && context.onNavigatePage)
  const baseClass = stacked
    ? 'block w-full px-4 py-3 text-left no-underline'
    : 'inline-flex items-center whitespace-nowrap px-2 no-underline'

  function go() {
    if (path) context.onNavigatePage?.(path)
  }

  const content = <span className={current ? 'underline underline-offset-4' : undefined}>{item.label}</span>

  if (context.publish && href) {
    return (
      <a
        href={href}
        className={`${baseClass} ${className ?? ''}`}
        style={style}
        aria-current={current ? 'page' : undefined}
        onClick={(event) => {
          if (context.onNavigatePage) {
            event.preventDefault()
            go()
          }
        }}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      className={`${baseClass} ${className ?? ''}`}
      style={style}
      aria-current={current ? 'page' : undefined}
      disabled={!canNavigate}
      onClick={go}
    >
      {content}
    </button>
  )
}

const DROPDOWN_MIN_WIDTH_PX = 160
const DROPDOWN_VIEWPORT_PADDING_PX = 8

function computeInlineDropdownPosition(
  trigger: HTMLElement,
  menu: HTMLElement | null,
  align: 'start' | 'center' | 'end',
): { top: number; left: number } {
  const rect = trigger.getBoundingClientRect()
  const menuWidth = menu?.offsetWidth ?? DROPDOWN_MIN_WIDTH_PX
  const maxLeft = Math.max(DROPDOWN_VIEWPORT_PADDING_PX, window.innerWidth - menuWidth - DROPDOWN_VIEWPORT_PADDING_PX)

  let left = rect.left
  if (align === 'end') {
    left = rect.right - menuWidth
  } else if (align === 'center') {
    left = rect.left + (rect.width - menuWidth) / 2
  }

  left = Math.max(DROPDOWN_VIEWPORT_PADDING_PX, Math.min(left, maxLeft))
  return { top: rect.bottom, left }
}

function InlineDropdownItem({
  item,
  context,
  align,
  openId,
  onToggle,
}: {
  item: MenuItem
  context: MenuLinkContext
  align: 'start' | 'center' | 'end'
  openId: string | null
  onToggle: (id: string | null) => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const hasChildren = item.children.length > 0
  const open = openId === item.id
  const style = itemLinkStyle(context.theme, item.textStyleId, context.breakpoint)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPosition(null)
      return
    }

    function updatePosition() {
      if (!triggerRef.current) return
      setMenuPosition(computeInlineDropdownPosition(triggerRef.current, menuRef.current, align))
    }

    updatePosition()
    const raf = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [align, open, item.children.length])

  if (!hasChildren) {
    return <MenuLink item={item} context={context} />
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-addon-control=""
        className="inline-flex items-center gap-1 whitespace-nowrap px-2"
        style={style}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => onToggle(open ? null : item.id)}
      >
        {item.label}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              data-menu-dropdown=""
              className="fixed z-[10050] min-w-[10rem] rounded-md border border-border bg-background py-1 shadow-md"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              role="menu"
            >
              {item.children.map((child) => (
                <MenuLink key={child.id} item={child} context={context} stacked className="!px-3 !py-2" />
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function WrapScrollItem({ item, context, nested = false }: { item: MenuItem; context: MenuLinkContext; nested?: boolean }) {
  return (
    <div className={nested ? 'pl-3' : undefined}>
      <MenuLink item={item} context={context} />
      {item.children.length > 0 ? (
        <div className="flex flex-col gap-1 pl-2">
          {item.children.map((child) => (
            <WrapScrollItem key={child.id} item={child} context={context} nested />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function HamburgerMenu({
  items,
  settings,
  context,
}: {
  items: MenuItem[]
  settings: ReturnType<typeof resolveMenuSettings>
  context: MenuLinkContext
}) {
  const { t } = useTranslation('website')
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const canOpen = !context.interactive
  const panelClass = settings.panelSide === 'left' ? 'left-0' : 'right-0'
  const iconColor = items[0] ? itemLinkStyle(context.theme, items[0].textStyleId, context.breakpoint).color : undefined

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <div className={`flex h-full w-full items-center ${alignClass(settings.align)}`}>
      <button
        type="button"
        data-addon-control=""
        className="inline-flex h-10 w-10 items-center justify-center rounded-md"
        style={{ color: iconColor }}
        aria-label={open ? t('closeMenu') : t('openMenu')}
        aria-expanded={open}
        disabled={!canOpen}
        onClick={() => canOpen && setOpen(true)}
      >
        <MenuIcon className="h-6 w-6" aria-hidden />
      </button>
      {open && canOpen
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                className="absolute inset-0 bg-black/50"
                aria-label={t('closeMenu')}
                onClick={() => setOpen(false)}
              />
              <aside
                className={`absolute inset-y-0 ${panelClass} flex w-[min(20rem,90vw)] flex-col bg-background shadow-lg`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h2 id={titleId} className="text-sm font-semibold">
                    {t('menu')}
                  </h2>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                    aria-label={t('closeMenu')}
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
                  {items.map((item) => {
                    const hasChildren = item.children.length > 0
                    const expanded = expandedId === item.id
                    if (!hasChildren) {
                      return (
                        <MenuLink
                          key={item.id}
                          item={item}
                          context={{
                            ...context,
                            onNavigatePage: (path) => {
                              context.onNavigatePage?.(path)
                              setOpen(false)
                            },
                          }}
                          stacked
                        />
                      )
                    }
                    return (
                      <div key={item.id}>
                        <button
                          type="button"
                          data-addon-control=""
                          className="flex w-full items-center justify-between px-4 py-3 text-left"
                          style={itemLinkStyle(context.theme, item.textStyleId, context.breakpoint)}
                          aria-expanded={expanded}
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                        >
                          {item.label}
                          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
                        </button>
                        {expanded ? (
                          <div className="border-l border-border pl-2">
                            {item.children.map((child) => (
                              <MenuLink
                                key={child.id}
                                item={child}
                                context={{
                                  ...context,
                                  onNavigatePage: (path) => {
                                    context.onNavigatePage?.(path)
                                    setOpen(false)
                                  },
                                }}
                                stacked
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </nav>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function MenuRenderer({
  addon,
  breakpoint,
  theme,
  pages = [],
  currentPageId,
  companyId,
  interactive,
  publish,
  onNavigatePage,
}: AddonRenderProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openDropdownId) return
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (containerRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('[data-menu-dropdown]')) return
      setOpenDropdownId(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [openDropdownId])

  if (addon.type !== 'menu') return null

  const settings = resolveMenuSettings(addon.props, breakpoint)
  const items = addon.props.items.length > 0 ? addon.props.items : PLACEHOLDER_ITEMS
  const context: MenuLinkContext = {
    theme,
    breakpoint,
    pages,
    currentPageId,
    companyId,
    interactive,
    publish,
    onNavigatePage,
  }

  if (settings.mode === 'hamburger') {
    return <HamburgerMenu items={items} settings={settings} context={context} />
  }

  if (settings.mode === 'wrap') {
    return (
      <nav
        ref={containerRef}
        className={`flex h-full w-full flex-wrap content-center items-center gap-x-2 gap-y-1 ${alignClass(settings.align)}`}
      >
        {items.map((item) => (
          <WrapScrollItem key={item.id} item={item} context={context} />
        ))}
      </nav>
    )
  }

  if (settings.mode === 'scroll') {
    return (
      <nav
        ref={containerRef}
        className={`flex h-full w-full flex-nowrap items-center overflow-x-auto ${alignClass(settings.align)}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item) => (
          <div key={item.id} className="shrink-0">
            <WrapScrollItem item={item} context={context} />
          </div>
        ))}
      </nav>
    )
  }

  return (
    <nav
      ref={containerRef}
      className={`flex h-full w-full flex-nowrap items-center gap-1 ${alignClass(settings.align)}`}
    >
      {items.map((item) => (
        <InlineDropdownItem
          key={item.id}
          item={item}
          context={context}
          align={settings.align}
          openId={openDropdownId}
          onToggle={setOpenDropdownId}
        />
      ))}
    </nav>
  )
}

function TextStyleSelect({
  id,
  value,
  theme,
  onChange,
}: {
  id: string
  value: string
  theme: WebsiteTheme | null
  onChange: (value: string) => void
}) {
  const { t } = useTranslation('website')
  return (
    <Select value={value || '__none'} onValueChange={(next) => onChange(next === '__none' ? '' : next)}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">{t('common:none')}</SelectItem>
        {(theme?.textStyles ?? []).map((style: WebsiteTextStyle) => (
          <SelectItem key={style.id} value={style.id}>
            {style.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PageLinkSelect({
  id,
  value,
  pages,
  onChange,
}: {
  id: string
  value: string | null
  pages: AddonPropsFieldsProps['pages']
  onChange: (value: string | null) => void
}) {
  const { t } = useTranslation('website')
  return (
    <Select value={value || '__none'} onValueChange={(next) => onChange(next === '__none' ? null : next)}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">{t('noLink')}</SelectItem>
        {pages.map((page) => (
          <SelectItem key={page.id} value={page.id}>
            {page.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MenuItemEditor({
  item,
  index,
  total,
  theme,
  pages,
  isSubItem,
  onChange,
  onRemove,
  onMove,
  onAddSubItem,
  onReorderSiblings,
}: {
  item: MenuItem
  index: number
  total: number
  theme: WebsiteTheme | null
  pages: AddonPropsFieldsProps['pages']
  isSubItem?: boolean
  onChange: (patch: Partial<MenuItem>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
  onAddSubItem?: () => void
  onReorderSiblings?: (direction: -1 | 1) => void
}) {
  const { t } = useTranslation('website')
  const prefix = `${item.id}-${isSubItem ? 'sub' : 'top'}`

  return (
    <li className="space-y-2 rounded-md border border-[hsl(var(--glass-border))] p-3">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label || t('menuItem')}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={t('moveItemUp')}
          disabled={index === 0}
          onClick={() => (onReorderSiblings ? onReorderSiblings(-1) : onMove(-1))}
        >
          <ChevronUp className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={t('moveItemDown')}
          disabled={index === total - 1}
          onClick={() => (onReorderSiblings ? onReorderSiblings(1) : onMove(1))}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={t('removeMenuItem')}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <FormField label={t('label')} htmlFor={`${prefix}-label`}>
        <Input id={`${prefix}-label`} value={item.label} onChange={(event) => onChange({ label: event.target.value })} />
      </FormField>
      <FormField label={t('textStyle')} htmlFor={`${prefix}-text-style`}>
        <TextStyleSelect
          id={`${prefix}-text-style`}
          value={item.textStyleId}
          theme={theme}
          onChange={(textStyleId) => onChange({ textStyleId })}
        />
      </FormField>
      <FormField label={t('linkPage')} htmlFor={`${prefix}-link`}>
        <PageLinkSelect
          id={`${prefix}-link`}
          value={item.linkPageId}
          pages={pages}
          onChange={(linkPageId) => onChange({ linkPageId })}
        />
      </FormField>
      {!isSubItem && onAddSubItem ? (
        <Button type="button" variant="outline" className="h-9" onClick={onAddSubItem}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          {t('addSubItem')}
        </Button>
      ) : null}
      {!isSubItem && item.children.length > 0 ? (
        <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-3">
          <p className="text-sm font-medium">{t('subItems')}</p>
          <ul className="space-y-2">
            {item.children.map((child, childIndex) => (
              <MenuItemEditor
                key={child.id}
                item={child}
                index={childIndex}
                total={item.children.length}
                theme={theme}
                pages={pages}
                isSubItem
                onChange={(patch) =>
                  onChange({
                    children: item.children.map((c) => (c.id === child.id ? { ...c, ...patch } : c)),
                  })
                }
                onRemove={() => onChange({ children: item.children.filter((c) => c.id !== child.id) })}
                onMove={() => {}}
                onReorderSiblings={(direction) =>
                  onChange({ children: moveMenuItem(item.children, child.id, direction) })
                }
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  )
}

function MenuPropsFields({ addon, breakpoint, theme, pages, onChange }: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'menu') return null

  const menuAddon: Extract<WebsiteAddon, { type: 'menu' }> = addon
  const settings = resolveMenuSettings(menuAddon.props, breakpoint)

  function patchSettings(patch: Parameters<typeof updateMenuBreakpointSettings>[2]) {
    onChange({
      ...menuAddon,
      props: updateMenuBreakpointSettings(menuAddon.props, breakpoint, patch),
    })
  }

  function patchItems(items: MenuItem[]) {
    onChange({ ...menuAddon, props: { ...menuAddon.props, items } })
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">{t('menuBreakpointHint')}</p>
      <FormField label={t('menuDisplayMode')} htmlFor="menu-display-mode">
        <Select
          value={settings.mode}
          onValueChange={(value) =>
            patchSettings({
              mode: value as typeof settings.mode,
              panelSide: value === 'hamburger' ? settings.panelSide ?? 'right' : undefined,
            })
          }
        >
          <SelectTrigger id="menu-display-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inline">{t('menuModeInline')}</SelectItem>
            <SelectItem value="hamburger">{t('menuModeHamburger')}</SelectItem>
            <SelectItem value="wrap">{t('menuModeWrap')}</SelectItem>
            <SelectItem value="scroll">{t('menuModeScroll')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('align')} htmlFor="menu-align">
        <Select value={settings.align} onValueChange={(value) => patchSettings({ align: value as typeof settings.align })}>
          <SelectTrigger id="menu-align">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">{t('alignStart')}</SelectItem>
            <SelectItem value="center">{t('alignCenter')}</SelectItem>
            <SelectItem value="end">{t('alignEnd')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      {settings.mode === 'hamburger' ? (
        <FormField label={t('panelSide')} htmlFor="menu-panel-side">
          <Select
            value={settings.panelSide ?? 'right'}
            onValueChange={(value) => patchSettings({ panelSide: value as 'left' | 'right' })}
          >
            <SelectTrigger id="menu-panel-side">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">{t('panelLeft')}</SelectItem>
              <SelectItem value="right">{t('panelRight')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
      <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{t('menuItems')}</p>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => patchItems([...menuAddon.props.items, createMenuItem()])}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t('addMenuItem')}
          </Button>
        </div>
        {menuAddon.props.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('menuItemsEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {menuAddon.props.items.map((item, index) => (
              <MenuItemEditor
                key={item.id}
                item={item}
                index={index}
                total={menuAddon.props.items.length}
                theme={theme}
                pages={pages}
                onChange={(patch) => patchItems(updateMenuItem(menuAddon.props.items, item.id, patch))}
                onRemove={() => patchItems(removeMenuItem(menuAddon.props.items, item.id))}
                onMove={(direction) => patchItems(moveMenuItem(menuAddon.props.items, item.id, direction))}
                onAddSubItem={() => patchItems(addSubItem(menuAddon.props.items, item.id))}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function createDefaultMenuAddon(zIndex: number): WebsiteAddon {
  const parentId = nanoid(10)
  const childId = nanoid(10)
  return {
    id: nanoid(10),
    type: 'menu',
    zIndex,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 8, height: 48 }),
    props: {
      displayByBreakpoint: {
        '2xl': { mode: 'inline', align: 'start' },
      },
      items: [
        {
          id: parentId,
          label: 'Home',
          textStyleId: '',
          linkPageId: null,
          children: [],
        },
        {
          id: nanoid(10),
          label: 'More',
          textStyleId: '',
          linkPageId: null,
          children: [
            {
              id: childId,
              label: 'About',
              textStyleId: '',
              linkPageId: null,
              children: [],
            },
          ],
        },
      ],
    },
  }
}

export const menuAddonModule: AddonModule = {
  type: 'menu',
  labelKey: 'menu',
  descriptionKey: 'menuDescription',
  createDefaultAddon: createDefaultMenuAddon,
  RenderComponent: MenuRenderer,
  PropsFields: MenuPropsFields,
}
