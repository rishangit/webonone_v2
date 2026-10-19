import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import {
  defaultElementHtml,
  effectiveElementHtml,
  elementScopeClass,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
  queryWebsiteElementRoot,
  runElementScript,
  scopedElementVisualOverrideCss,
  substituteElementPlaceholders,
  WEBSITE_ELEMENT_ROOT_VISUAL_CSS,
  type ElementVisualStyle,
  type WebsiteElementCustomization,
  type WebsiteElementKind,
} from '../utils/websiteElementCustomization'

function visualFromBaseStyle(style?: CSSProperties): ElementVisualStyle | undefined {
  if (!style) return undefined
  return {
    background: typeof style.background === 'string' ? style.background : undefined,
    color: typeof style.color === 'string' ? style.color : undefined,
    border: typeof style.border === 'string' ? style.border : undefined,
    borderRadius:
      typeof style.borderRadius === 'number' || typeof style.borderRadius === 'string'
        ? style.borderRadius
        : undefined,
    fontFamily: typeof style.fontFamily === 'string' ? style.fontFamily : undefined,
    fontSize:
      typeof style.fontSize === 'number' || typeof style.fontSize === 'string' ? style.fontSize : undefined,
    lineHeight:
      typeof style.lineHeight === 'number' || typeof style.lineHeight === 'string'
        ? style.lineHeight
        : undefined,
  }
}

type CustomWebsiteElementHostProps = {
  scopeId: string
  kind: WebsiteElementKind
  customization?: WebsiteElementCustomization | null
  placeholders: Record<string, string>
  baseStyle?: CSSProperties
  className?: string
  fallback: React.ReactNode
  scriptContext?: Record<string, unknown>
  paletteColors?: string[]
}

export function CustomWebsiteElementHost({
  scopeId,
  kind,
  customization,
  placeholders,
  baseStyle,
  className,
  fallback,
  scriptContext = {},
  paletteColors,
}: CustomWebsiteElementHostProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const normalized = useMemo(() => normalizeWebsiteElementCustomization(customization), [customization])
  const scopeClass = elementScopeClass(scopeId)
  const useCustomHtml = normalized.html.trim().length > 0
  const visual = useMemo(() => {
    const fromStyle = visualFromBaseStyle(baseStyle)
    if (!fromStyle && !paletteColors?.length) return undefined
    return { ...fromStyle, paletteColors }
  }, [baseStyle, paletteColors])
  const html = useMemo(
    () =>
      substituteElementPlaceholders(
        effectiveElementHtml(normalized, defaultElementHtml(kind, scopeId, visual), visual),
        placeholders,
      ),
    [kind, normalized, placeholders, scopeId, visual],
  )

  useEffect(() => {
    if (!hasElementCustomization(normalized)) return undefined
    return runElementScript(queryWebsiteElementRoot(rootRef.current), normalized, {
      kind,
      placeholders,
      scopeClass,
      ...scriptContext,
    })
  }, [kind, normalized, placeholders, scopeClass, scriptContext])

  const visualCss = <style>{WEBSITE_ELEMENT_ROOT_VISUAL_CSS}</style>
  const scopedVisualCss = visual ? scopedElementVisualOverrideCss(scopeId, visual) : ''
  const scopedVisualStyle = scopedVisualCss ? <style>{scopedVisualCss}</style> : null
  const customCss = normalized.styles.trim() ? <style>{normalized.styles}</style> : null
  const paletteStyle = Object.fromEntries(
    (paletteColors ?? []).map((value, index) => [`--el-color-${index + 1}`, value]),
  ) as CSSProperties

  if (!useCustomHtml) {
    return (
      <div
        ref={rootRef}
        className={['website-element-root', scopeClass, className].filter(Boolean).join(' ')}
        style={{ ...baseStyle, ...paletteStyle }}
        data-website-element={kind}
      >
        {visualCss}
        {scopedVisualStyle}
        {customCss}
        {fallback}
      </div>
    )
  }

  const htmlIncludesRoot = /website-element-root/.test(html)

  return (
    <div className={className}>
      {visualCss}
      {scopedVisualStyle}
      {customCss}
      <div
        ref={rootRef}
        className={htmlIncludesRoot ? undefined : `website-element-root ${scopeClass} h-full w-full`}
        style={htmlIncludesRoot ? undefined : { ...baseStyle, ...paletteStyle }}
        data-website-element={htmlIncludesRoot ? undefined : kind}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
