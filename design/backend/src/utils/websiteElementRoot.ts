/** Keep button/text library markup aligned with the designer: button is the root. */

export type WebsiteElementKind = 'button' | 'text'

export function elementScopeClass(scopeId: string): string {
  return `website-el-${scopeId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

const BUTTON_ROOT_LAYOUT_CLASSES = 'inline-flex items-center justify-center px-4 py-2'

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

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
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

function isSimpleButtonBody(body: string): boolean {
  const inner = body.replace(/<\/[a-zA-Z][\w:-]*>\s*$/i, '').trim()
  return /^(?:\{\{label\}\}|<span\b[^>]*>\s*\{\{label\}\}\s*<\/span>)$/i.test(inner)
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
      ? rest.replace(new RegExp(`</${tag}\\s*>\s*$`, 'i'), `</${nextTag}>`)
      : rest
  return `<${nextTag}${attrs}>${body}`
}

/** Promote an inner <button> so it is the root (AI often wraps it in a div). */
export function normalizeLibraryElementHtml(
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
    const mergedClass = classList(
      readAttr(wrapperAttrs, 'class'),
      readAttr(buttonAttrs, 'class'),
      'website-element-root',
      scopeClass,
      BUTTON_ROOT_LAYOUT_CLASSES,
    )
    let attrs = setAttr(buttonAttrs, 'class', mergedClass)
    attrs = setAttr(attrs, 'type', readAttr(buttonAttrs, 'type') || 'button')
    attrs = setAttr(attrs, 'data-website-element', 'button')
    const mergedStyle = [readAttr(wrapperAttrs, 'style'), readAttr(buttonAttrs, 'style')]
      .map((item) => item?.replace(/;\s*$/, '').trim())
      .filter((item): item is string => Boolean(item))
      .join('; ')
    if (mergedStyle) attrs = setAttr(attrs, 'style', mergedStyle)
    return `<button${attrs}>${inner}</button>`
  }
  return ensureRootClasses(trimmed, 'button', scopeClass)
}

export function normalizeStoredCustomization(
  customization: { html: string; styles: string; scripts: string } | undefined,
  kind: WebsiteElementKind,
  scopeId: string,
): { html: string; styles: string; scripts: string } | undefined {
  if (!customization) return undefined
  const html = customization.html.trim()
    ? normalizeLibraryElementHtml(customization.html, kind, scopeId)
    : customization.html
  const styles =
    customization.html.trim() || customization.styles.trim()
      ? ensureElementRootStyles(customization.styles, scopeId)
      : customization.styles
  if (!html.trim() && !styles.trim() && !customization.scripts.trim()) return undefined
  return { html, styles, scripts: customization.scripts }
}
