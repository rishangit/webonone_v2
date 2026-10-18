export type WebsiteElementCustomization = {
  html: string
  styles: string
  scripts: string
}

export type WebsiteElementKind = 'button' | 'text'

export function elementScopeClass(scopeId: string): string {
  return `website-el-${scopeId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

function classList(...parts: Array<string | undefined>): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of parts) {
    if (!part) continue
    for (const token of part.split(/\s+/)) {
      if (!token || seen.has(token)) continue
      seen.add(token)
      out.push(token)
    }
  }
  return out.join(' ')
}

/** Visual values from basic settings, baked into default HTML so the markup matches the preview. */
export type ElementVisualStyle = {
  background?: string
  color?: string
  border?: string
  borderRadius?: string | number
  fontFamily?: string
  fontSize?: string | number
  lineHeight?: string | number
}

function cssLength(value: string | number | undefined): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`
  return String(value)
}

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

const ELEMENT_VISUAL_VARS = {
  background: '--el-bg',
  color: '--el-color',
  border: '--el-border',
  borderRadius: '--el-radius',
  fontFamily: '--el-font-family',
  fontSize: '--el-font-size',
  lineHeight: '--el-line-height',
} as const

const ELEMENT_VISUAL_PAINT_PROPS = new Set([
  'background',
  'background-color',
  'color',
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'font-family',
  'font-size',
  'line-height',
  ELEMENT_VISUAL_VARS.background,
  ELEMENT_VISUAL_VARS.color,
  ELEMENT_VISUAL_VARS.border,
  ELEMENT_VISUAL_VARS.borderRadius,
  ELEMENT_VISUAL_VARS.fontFamily,
  ELEMENT_VISUAL_VARS.fontSize,
  ELEMENT_VISUAL_VARS.lineHeight,
])

const BUTTON_ROOT_LAYOUT_CLASSES = 'inline-flex items-center justify-center px-4 py-2'

/** Zero-specificity so Tailwind utilities on the same element win over basic settings. */
export const WEBSITE_ELEMENT_ROOT_VISUAL_CSS = [
  ':where(.website-element-root) {',
  `  background-color: var(${ELEMENT_VISUAL_VARS.background});`,
  `  color: var(${ELEMENT_VISUAL_VARS.color});`,
  `  border: var(${ELEMENT_VISUAL_VARS.border});`,
  `  border-radius: var(${ELEMENT_VISUAL_VARS.borderRadius});`,
  `  font-family: var(${ELEMENT_VISUAL_VARS.fontFamily});`,
  `  font-size: var(${ELEMENT_VISUAL_VARS.fontSize});`,
  `  line-height: var(${ELEMENT_VISUAL_VARS.lineHeight});`,
  '}',
].join('\n')

export function visualStyleToCssVars(style: ElementVisualStyle): string {
  const decls: string[] = []
  const add = (property: string, value: string | undefined) => {
    const trimmed = value?.trim()
    if (trimmed) decls.push(`${property}: ${trimmed}`)
  }
  add(ELEMENT_VISUAL_VARS.background, style.background)
  add(ELEMENT_VISUAL_VARS.color, style.color)
  add(ELEMENT_VISUAL_VARS.border, style.border)
  add(ELEMENT_VISUAL_VARS.borderRadius, cssLength(style.borderRadius))
  add(ELEMENT_VISUAL_VARS.fontFamily, style.fontFamily)
  add(ELEMENT_VISUAL_VARS.fontSize, cssLength(style.fontSize))
  if (style.lineHeight != null && style.lineHeight !== '') {
    add(ELEMENT_VISUAL_VARS.lineHeight, String(style.lineHeight))
  }
  return decls.join('; ')
}

export function buttonVisualFromResolved(snap: {
  background: string
  textColor: string
  borderWidth: number
  borderColor: string
  radius: number
  fontFamily: string
  fontSize: number | string
}): ElementVisualStyle {
  return {
    background: snap.background,
    color: snap.textColor,
    border: `${snap.borderWidth}px solid ${snap.borderColor}`,
    borderRadius: snap.radius,
    fontFamily: snap.fontFamily,
    fontSize: snap.fontSize,
    lineHeight: 1,
  }
}

export function defaultElementHtml(
  kind: WebsiteElementKind,
  scopeId?: string,
  visual?: ElementVisualStyle,
): string {
  const scopeClass = scopeId ? elementScopeClass(scopeId) : ''
  const cssVars = visual ? visualStyleToCssVars(visual) : ''
  const styleAttr = cssVars ? ` style="${escapeAttr(cssVars)}"` : ''
  if (kind === 'button') {
    const rootClass = classList('website-element-root', scopeClass, BUTTON_ROOT_LAYOUT_CLASSES)
    return `<button type="button" class="${rootClass}" data-website-element="button"${styleAttr}>{{label}}</button>`
  }
  const rootClass = classList('website-element-root', scopeClass)
  return `<div class="${rootClass}" data-website-element="text"${styleAttr}><span class="website-text-content">{{content}}</span></div>`
}

export function defaultElementStyles(scopeId: string): string {
  return `.${elementScopeClass(scopeId)} {\n}\n`
}

export function ensureElementRootStyles(styles: string, scopeId: string): string {
  const selector = `.${elementScopeClass(scopeId)}`
  const trimmed = styles.trim()
  if (!trimmed) return defaultElementStyles(scopeId)
  if (trimmed.includes(selector)) return styles
  return `${defaultElementStyles(scopeId).trimEnd()}\n${trimmed}\n`
}

function readAttr(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return match?.[1] ?? match?.[2]
}

function setAttr(attrs: string, name: string, value: string): string {
  const withoutBare = attrs.replace(new RegExp(`\\s${name}(?!\\s*=)`, 'i'), '')
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*')`, 'i')
  if (re.test(withoutBare)) {
    return withoutBare.replace(re, ` ${name}="${escapeAttr(value)}"`)
  }
  return `${withoutBare} ${name}="${escapeAttr(value)}"`
}

function mergeClassAttrs(wrapperAttrs: string, innerAttrs: string, required: string): string {
  return classList(readAttr(wrapperAttrs, 'class'), readAttr(innerAttrs, 'class'), required)
}

function mergeStyleAttrs(wrapperAttrs: string, innerAttrs: string): string {
  return [readAttr(wrapperAttrs, 'style'), readAttr(innerAttrs, 'style')]
    .map((item) => item?.replace(/;\s*$/, '').trim())
    .filter((item): item is string => Boolean(item))
    .join('; ')
}

function isSimpleButtonBody(body: string): boolean {
  const inner = body.replace(/<\/[a-zA-Z][\w:-]*>\s*$/i, '').trim()
  return /^(?:\{\{label\}\}|<span\b[^>]*>\s*\{\{label\}\}\s*<\/span>)$/i.test(inner)
}

/** Promote an inner <button> so it is the root (AI often wraps it in a div). */
export function normalizeElementRootHtml(
  html: string,
  kind: WebsiteElementKind,
  scopeId: string,
): string {
  const trimmed = html.trim()
  if (!trimmed) return trimmed
  const scopeClass = elementScopeClass(scopeId)
  if (kind !== 'button') {
    return ensureRootClasses(trimmed, kind, scopeClass)
  }
  const wrapped = trimmed.match(
    /^<(div|span)(\s[^>]*)?>\s*<button(\s[^>]*)?>([\s\S]*)<\/button>\s*<\/(?:div|span)>$/i,
  )
  if (wrapped) {
    const wrapperAttrs = wrapped[2] ?? ''
    const buttonAttrs = wrapped[3] ?? ''
    const inner = wrapped[4] ?? ''
    const mergedClass = mergeClassAttrs(
      wrapperAttrs,
      buttonAttrs,
      classList('website-element-root', scopeClass, BUTTON_ROOT_LAYOUT_CLASSES),
    )
    let attrs = setAttr(buttonAttrs, 'class', mergedClass)
    attrs = setAttr(attrs, 'type', readAttr(buttonAttrs, 'type') || 'button')
    attrs = setAttr(attrs, 'data-website-element', 'button')
    const mergedStyle = mergeStyleAttrs(wrapperAttrs, buttonAttrs)
    if (mergedStyle) attrs = setAttr(attrs, 'style', mergedStyle)
    return `<button${attrs}>${inner}</button>`
  }
  return ensureRootClasses(trimmed, 'button', scopeClass)
}

function ensureRootClasses(html: string, kind: WebsiteElementKind, scopeClass: string): string {
  const match = html.match(/^<([a-zA-Z][\w:-]*)(\s[^>]*)?>([\s\S]*)$/)
  if (!match) return html
  const tag = match[1]
  let attrs = match[2] ?? ''
  const rest = match[3] ?? ''
  const required =
    kind === 'button'
      ? classList('website-element-root', scopeClass, BUTTON_ROOT_LAYOUT_CLASSES)
      : classList('website-element-root', scopeClass)
  attrs = setAttr(attrs, 'class', classList(readAttr(attrs, 'class'), required))
  attrs = setAttr(attrs, 'data-website-element', kind)
  let nextTag = tag
  if (kind === 'button') {
    attrs = setAttr(attrs, 'type', readAttr(attrs, 'type') || 'button')
    if (tag.toLowerCase() === 'button' || isSimpleButtonBody(rest)) {
      nextTag = 'button'
    }
  }
  const body =
    nextTag.toLowerCase() !== tag.toLowerCase()
      ? rest.replace(new RegExp(`</${tag}\\s*>\\s*$`, 'i'), `</${nextTag}>`)
      : rest
  return `<${nextTag}${attrs}>${body}`
}

function compactCss(value: string): string {
  return value.replace(/\s+/g, '')
}

export function isDefaultElementStyles(styles: string, scopeId: string): boolean {
  return compactCss(styles) === compactCss(defaultElementStyles(scopeId))
}

/** Inner-only label markup (no website-element-root wrapper) is treated as generated default. */
export function isSkeletonElementHtml(html: string): boolean {
  const trimmed = html.trim()
  if (!trimmed) return true
  return /^<(span|button)\b[^>]*>\s*\{\{(?:label|content)\}\}\s*<\/(?:span|button)>$/i.test(trimmed)
}

function parseInlineCss(css: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const part of css.split(';')) {
    const idx = part.indexOf(':')
    if (idx < 0) continue
    const property = part.slice(0, idx).trim().toLowerCase()
    const value = part.slice(idx + 1).trim()
    if (property && value) map.set(property, value)
  }
  return map
}

function serializeInlineCss(map: Map<string, string>): string {
  return [...map.entries()].map(([property, value]) => `${property}: ${value}`).join('; ')
}

function stripPaintFromInlineCss(css: string): string {
  const map = parseInlineCss(css)
  for (const property of [...map.keys()]) {
    if (ELEMENT_VISUAL_PAINT_PROPS.has(property)) map.delete(property)
  }
  return serializeInlineCss(map)
}

function applyCssVarsToTag(tag: string, attrs: string, selfClose: string, cssVars: string): string {
  const classMatch = attrs.match(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
  const mergedClass = classList(
    classMatch?.[1] ?? classMatch?.[2] ?? '',
    /\bwebsite-element-root\b/.test(attrs) ? undefined : 'website-element-root',
  )
  let nextAttrs = classMatch
    ? attrs.replace(/\sclass\s*=\s*(?:"[^"]*"|'[^']*')/i, ` class="${escapeAttr(mergedClass)}"`)
    : `${attrs} class="${escapeAttr(mergedClass)}"`
  const styleMatch = nextAttrs.match(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
  if (!styleMatch) {
    return `<${tag}${nextAttrs} style="${escapeAttr(cssVars)}"${selfClose}>`
  }
  const existing = stripPaintFromInlineCss(styleMatch[1] ?? styleMatch[2] ?? '')
  const merged = existing ? `${existing}; ${cssVars}` : cssVars
  nextAttrs = nextAttrs.replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/i, ` style="${escapeAttr(merged)}"`)
  return `<${tag}${nextAttrs}${selfClose}>`
}

function stripPaintStylesFromHtml(html: string): string {
  return html.replace(/<([a-zA-Z][\w:-]*)([^>]*?)(\s*\/)?>/g, (full, tag, attrs, selfClose) => {
    const styleMatch = attrs.match(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    if (!styleMatch) return full
    const next = stripPaintFromInlineCss(styleMatch[1] ?? styleMatch[2] ?? '')
    const nextAttrs = next
      ? attrs.replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/i, ` style="${escapeAttr(next)}"`)
      : attrs.replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/i, '')
    return `<${tag}${nextAttrs}${selfClose ?? ''}>`
  })
}

/** Write basic-settings visuals onto the root as CSS variables so Tailwind classes can override them. */
export function applyVisualStyleToHtml(html: string, visual?: ElementVisualStyle): string {
  const trimmed = html.trim()
  const cssVars = visual ? visualStyleToCssVars(visual) : ''
  if (!trimmed || !cssVars) return html
  const withoutPaint = stripPaintStylesFromHtml(trimmed)
  const tagRe = /<([a-zA-Z][\w:-]*)([^>]*?)(\s*\/)?>/g
  let match: RegExpExecArray | null
  let rootMatch: RegExpExecArray | null = null
  let firstMatch: RegExpExecArray | null = null
  while ((match = tagRe.exec(withoutPaint))) {
    if (!firstMatch) firstMatch = match
    if (/\bwebsite-element-root\b/.test(match[2])) {
      rootMatch = match
      break
    }
  }
  const target = rootMatch ?? firstMatch
  if (!target) return withoutPaint
  const [full, tag, attrs, selfClose] = target
  return (
    withoutPaint.slice(0, target.index) +
    applyCssVarsToTag(tag, attrs, selfClose ?? '', cssVars) +
    withoutPaint.slice(target.index + full.length)
  )
}

export function queryWebsiteElementRoot(host: HTMLElement | null): HTMLElement | null {
  if (!host) return null
  if (host.matches('.website-element-root')) return host
  return host.querySelector('.website-element-root') ?? host
}

function inferElementKind(html: string): WebsiteElementKind {
  return /data-website-element="text"/.test(html) ? 'text' : 'button'
}

function inferScopeId(html: string): string | undefined {
  return html.match(/\bwebsite-el-([A-Za-z0-9_-]+)\b/)?.[1]
}

export function effectiveElementHtml(
  customization: WebsiteElementCustomization,
  defaultHtml: string,
  visual?: ElementVisualStyle,
): string {
  const custom = customization.html.trim()
  const source = !custom || isSkeletonElementHtml(custom) ? defaultHtml : custom
  const kind = inferElementKind(`${defaultHtml}\n${source}`)
  const scopeId = inferScopeId(defaultHtml) ?? inferScopeId(source)
  const normalized = scopeId ? normalizeElementRootHtml(source, kind, scopeId) : source
  return applyVisualStyleToHtml(normalized, visual)
}

export function effectiveElementStyles(
  customization: WebsiteElementCustomization,
  defaultStyles: string,
  scopeId?: string,
): string {
  const styles = customization.styles.trim() ? customization.styles : defaultStyles
  return scopeId ? ensureElementRootStyles(styles, scopeId) : styles
}

/** Drop stored HTML/styles when they still match the generated defaults (keeps JSON lean). */
export function finalizeElementCustomization(
  customization: WebsiteElementCustomization,
  defaultHtml: string,
  scopeId?: string,
): WebsiteElementCustomization {
  const html = customization.html.trim()
  const normalizedDefault = defaultHtml.trim()
  const styles =
    scopeId && isDefaultElementStyles(customization.styles, scopeId) ? '' : customization.styles
  const storedHtml = !html || isSkeletonElementHtml(html) || html === normalizedDefault ? '' : customization.html
  return {
    html: storedHtml,
    styles,
    scripts: customization.scripts,
  }
}

export function emptyWebsiteElementCustomization(): WebsiteElementCustomization {
  return { html: '', styles: '', scripts: '' }
}

export function normalizeWebsiteElementCustomization(
  value?: WebsiteElementCustomization | null,
): WebsiteElementCustomization {
  if (!value) return emptyWebsiteElementCustomization()
  return {
    html: value.html ?? '',
    styles: value.styles ?? '',
    scripts: value.scripts ?? '',
  }
}

export function substituteElementPlaceholders(
  html: string,
  placeholders: Record<string, string>,
): string {
  return Object.entries(placeholders).reduce(
    (result, [key, replacement]) => result.replaceAll(`{{${key}}}`, replacement),
    html,
  )
}

export function hasElementCustomization(customization: WebsiteElementCustomization): boolean {
  return Boolean(customization.html.trim() || customization.styles.trim() || customization.scripts.trim())
}

/** Run optional element script once when mounted (designer + published page). */
export function runElementScript(
  root: HTMLElement | null,
  customization: WebsiteElementCustomization,
  context: Record<string, unknown>,
): void {
  const source = customization.scripts.trim()
  if (!source || !root) return
  try {
    const runner = new Function('root', 'context', source) as (
      root: HTMLElement,
      context: Record<string, unknown>,
    ) => void
    runner(root, context)
  } catch {
    // Invalid user script — skip without breaking the page
  }
}
