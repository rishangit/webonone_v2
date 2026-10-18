import { useEffect, useMemo, useRef } from 'react'
import {
  defaultElementHtml,
  defaultElementStyles,
  effectiveElementHtml,
  effectiveElementStyles,
  elementScopeClass,
  normalizeWebsiteElementCustomization,
  queryWebsiteElementRoot,
  runElementScript,
  substituteElementPlaceholders,
  WEBSITE_ELEMENT_ROOT_VISUAL_CSS,
  type ElementVisualStyle,
  type WebsiteElementCustomization,
  type WebsiteElementKind,
} from '../utils/websiteElementCustomization'

type WebsiteElementCustomizationPreviewProps = {
  scopeId: string
  kind: WebsiteElementKind
  customization?: WebsiteElementCustomization | null
  placeholders: Record<string, string>
  defaultHtml?: string
  visual?: ElementVisualStyle
  baseStyle?: React.CSSProperties
  className?: string
  fallback: React.ReactNode
}

export function WebsiteElementCustomizationPreview({
  scopeId,
  kind,
  customization,
  placeholders,
  defaultHtml,
  visual,
  baseStyle,
  className,
  fallback,
}: WebsiteElementCustomizationPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const normalized = useMemo(() => normalizeWebsiteElementCustomization(customization), [customization])
  const scopeClass = elementScopeClass(scopeId)
  const placeholderKey = JSON.stringify(placeholders)
  const html = useMemo(() => {
    const parsed = JSON.parse(placeholderKey) as Record<string, string>
    return substituteElementPlaceholders(
      effectiveElementHtml(normalized, defaultHtml || defaultElementHtml(kind, scopeId, visual), visual),
      parsed,
    )
  }, [defaultHtml, kind, normalized, placeholderKey, scopeId, visual])
  const styles = effectiveElementStyles(normalized, defaultElementStyles(scopeId), scopeId).trim()
  const remountKey = `${normalized.scripts}|${normalized.styles}|${html}`

  useEffect(() => {
    const parsed = JSON.parse(placeholderKey) as Record<string, string>
    runElementScript(queryWebsiteElementRoot(hostRef.current), normalized, {
      kind,
      placeholders: parsed,
      scopeClass,
    })
  }, [kind, normalized, placeholderKey, remountKey, scopeClass])

  const visualCss = <style>{WEBSITE_ELEMENT_ROOT_VISUAL_CSS}</style>
  const customCss = styles ? <style>{styles}</style> : null

  if (!html.trim()) {
    return (
      <div className={className}>
        {visualCss}
        {customCss}
        <div
          key={remountKey}
          ref={hostRef}
          className={`website-element-root ${scopeClass}`}
          style={baseStyle}
          data-website-element={kind}
        >
          {fallback}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {visualCss}
      {customCss}
      <div
        key={remountKey}
        ref={hostRef}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
