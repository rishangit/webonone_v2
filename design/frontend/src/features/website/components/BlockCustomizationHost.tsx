import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  defaultElementHtml,
  defaultElementStyles,
  effectiveElementHtml,
  effectiveElementStyles,
  elementScopeClass,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
  queryWebsiteElementRoot,
  runElementScript,
} from '../utils/websiteElementCustomization'
import type { WebsiteElementCustomization } from '../types'

const CHILDREN_SLOT =
  '<div data-block-children-slot class="pointer-events-auto absolute inset-0"></div>'

type BlockCustomizationHostProps = {
  blockId: string
  customization?: WebsiteElementCustomization
  /** Block element, used when the shell has styles or scripts but no custom HTML. */
  blockRoot: HTMLElement | null
  children: ReactNode
}

function shellHtml(blockId: string, customization: WebsiteElementCustomization): string {
  if (!customization.html.trim()) return ''
  const shown = effectiveElementHtml(customization, defaultElementHtml('block', blockId))
  if (shown.includes('{{children}}')) return shown.replaceAll('{{children}}', CHILDREN_SLOT)
  return shown.replace(/(<\/[a-zA-Z][\w:-]*>)\s*$/, `${CHILDREN_SLOT}$1`)
}

/** Applies a block's own HTML, styles, and script. Nested elements stay React children. */
export function BlockCustomizationHost({
  blockId,
  customization,
  blockRoot,
  children,
}: BlockCustomizationHostProps) {
  const normalized = useMemo(() => normalizeWebsiteElementCustomization(customization), [customization])
  const html = useMemo(() => shellHtml(blockId, normalized), [blockId, normalized])
  const styles = normalized.styles.trim()
    ? effectiveElementStyles(normalized, defaultElementStyles(blockId), blockId)
    : ''
  const hostRef = useRef<HTMLDivElement>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const active = hasElementCustomization(normalized)

  useLayoutEffect(() => {
    if (!html) {
      setSlot(null)
      return
    }
    setSlot(hostRef.current?.querySelector<HTMLElement>('[data-block-children-slot]') ?? null)
  }, [html])

  useEffect(() => {
    if (!active) return undefined
    const root = html ? queryWebsiteElementRoot(hostRef.current) : blockRoot
    return runElementScript(root, normalized, {
      kind: 'block',
      scopeClass: elementScopeClass(blockId),
    })
  }, [active, blockId, blockRoot, html, normalized])

  if (!active) return children

  return (
    <>
      {styles ? <style>{styles}</style> : null}
      {html ? (
        <>
          <div ref={hostRef} className="pointer-events-none absolute inset-0" dangerouslySetInnerHTML={{ __html: html }} />
          {slot ? createPortal(children, slot) : null}
        </>
      ) : (
        children
      )}
    </>
  )
}

export function blockShellScopeClass(blockId: string, customization?: WebsiteElementCustomization): string | undefined {
  const normalized = normalizeWebsiteElementCustomization(customization)
  if (normalized.html.trim()) return undefined
  if (!normalized.styles.trim() && !normalized.scripts.trim()) return undefined
  return elementScopeClass(blockId)
}
