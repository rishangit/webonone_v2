import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { resolveTextStyle } from '../../document/theme'
import { emptyLayoutByBreakpoint } from '../../types'
import type { WebsiteAddon } from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'
import { publicPageHref } from '../../utils/companyPublicHost'

export const NAV_MENU_PLACEHOLDER_PAGES = [
  { id: 'preview-1', name: 'Page 1', path: 'page-1' },
  { id: 'preview-2', name: 'Page 2', path: 'page-2' },
]

function NavMenuRenderer({
  addon,
  breakpoint,
  theme,
  navPages = [],
  currentPageId,
  companyId,
  interactive,
  publish,
  onNavigatePage,
}: AddonRenderProps) {
  const { t } = useTranslation('website')
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const canOpen = !interactive

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

  if (addon.type !== 'navMenu') return null

  const items = navPages.length > 0 ? navPages : NAV_MENU_PLACEHOLDER_PAGES
  const style = theme?.textStyles.find((item) => item.id === addon.props.textStyleId)
  const snap = resolveTextStyle(theme ?? null, style, breakpoint)
  const collapsed = breakpoint === 'sm'

  function goTo(path: string) {
    onNavigatePage?.(path)
    setOpen(false)
  }

  const alignClass =
    addon.props.align === 'start'
      ? 'justify-start'
      : addon.props.align === 'center'
        ? 'justify-center'
        : 'justify-end'
  const linkStyle = {
    fontFamily: snap.fontFamily,
    fontSize: snap.size,
    color: snap.color,
  }

  function renderLinks(stacked: boolean) {
    return items.map((page) => {
      const current = currentPageId === page.id
      const href = publish && companyId ? publicPageHref(companyId, page.path) : undefined
      const className = stacked
        ? 'block w-full px-4 py-3 text-left no-underline'
        : 'inline-flex items-center whitespace-nowrap px-2 no-underline'
      const content = (
        <span className={current ? 'underline underline-offset-4' : undefined}>{page.name}</span>
      )
      if (publish && href) {
        return (
          <a
            key={page.id}
            href={href}
            className={className}
            style={linkStyle}
            aria-current={current ? 'page' : undefined}
            onClick={(event) => {
              if (onNavigatePage) {
                event.preventDefault()
                goTo(page.path)
              }
            }}
          >
            {content}
          </a>
        )
      }
      return (
        <button
          key={page.id}
          type="button"
          className={className}
          style={linkStyle}
          aria-current={current ? 'page' : undefined}
          disabled={!canOpen || !onNavigatePage}
          onClick={() => goTo(page.path)}
        >
          {content}
        </button>
      )
    })
  }

  if (collapsed) {
    return (
      <div className={`flex h-full w-full items-center ${alignClass}`}>
        <button
          type="button"
          data-addon-control=""
          className="inline-flex h-10 w-10 items-center justify-center rounded-md"
          style={{ color: snap.color }}
          aria-label={open ? t('closeMenu') : t('openMenu')}
          aria-expanded={open}
          disabled={!canOpen}
          onClick={() => canOpen && setOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden />
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
                  className="absolute inset-y-0 right-0 flex w-[min(20rem,90vw)] flex-col bg-background shadow-lg"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                >
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 id={titleId} className="text-sm font-semibold">
                      {t('navMenu')}
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
                  <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">{renderLinks(true)}</nav>
                </aside>
              </div>,
              document.body,
            )
          : null}
      </div>
    )
  }

  return <nav className={`flex h-full w-full flex-nowrap items-center gap-1 ${alignClass}`}>{renderLinks(false)}</nav>
}

function NavMenuPropsFields({ addon, theme, onChange }: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  if (addon.type !== 'navMenu') return null

  return (
    <>
      <FormField label={t('textStyle')} htmlFor="nav-text-style">
        <Select
          value={addon.props.textStyleId || '__none'}
          onValueChange={(value) =>
            onChange({
              ...addon,
              props: { ...addon.props, textStyleId: value === '__none' ? '' : value },
            })
          }
        >
          <SelectTrigger id="nav-text-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t('common:none')}</SelectItem>
            {(theme?.textStyles ?? []).map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('align')} htmlFor="nav-align">
        <Select
          value={addon.props.align}
          onValueChange={(value) =>
            onChange({
              ...addon,
              props: { ...addon.props, align: value as 'start' | 'center' | 'end' },
            })
          }
        >
          <SelectTrigger id="nav-align">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">{t('alignStart')}</SelectItem>
            <SelectItem value="center">{t('alignCenter')}</SelectItem>
            <SelectItem value="end">{t('alignEnd')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <p className="text-sm text-muted-foreground">{t('navMenuHint')}</p>
    </>
  )
}

function createDefaultNavMenuAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'navMenu',
    zIndex,
    layout: emptyLayoutByBreakpoint({ col: 5, colSpan: 8, top: 8, height: 48 }),
    props: {
      textStyleId: '',
      align: 'end',
    },
  }
}

export const navMenuAddonModule: AddonModule = {
  type: 'navMenu',
  labelKey: 'navMenu',
  descriptionKey: 'navMenuDescription',
  allowedKinds: ['headers'],
  createDefaultAddon: createDefaultNavMenuAddon,
  RenderComponent: NavMenuRenderer,
  PropsFields: NavMenuPropsFields,
}
