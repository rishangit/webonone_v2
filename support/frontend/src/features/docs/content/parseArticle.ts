import type { ArticleAudience, ArticleFrontmatter, HelpArticle } from './types'

const AUDIENCES: ArticleAudience[] = ['all', 'owner', 'staff', 'member', 'super_admin']

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseAudience(value: unknown): ArticleAudience {
  const raw = asString(value)
  return AUDIENCES.includes(raw as ArticleAudience) ? (raw as ArticleAudience) : 'all'
}

function extractHeadings(markdown: string): string[] {
  return markdown
    .split('\n')
    .map((line) => line.match(/^#{1,3}\s+(.+)$/)?.[1]?.trim())
    .filter((heading): heading is string => Boolean(heading))
}

function parseYamlScalar(raw: string): string | number {
  let value = raw.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value)
  }
  return value
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: raw }
  }
  const data: Record<string, unknown> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    if (!key) continue
    data[key] = parseYamlScalar(line.slice(idx + 1))
  }
  return { data, content: match[2] }
}

export function parseArticle(raw: string): HelpArticle | null {
  const parsed = parseFrontmatter(raw)
  const title = asString(parsed.data.title)
  const category = asString(parsed.data.category)
  const slug = asString(parsed.data.slug)
  if (!title || !category || !slug) {
    return null
  }

  const frontmatter: ArticleFrontmatter = {
    title,
    category,
    slug,
    audience: parseAudience(parsed.data.audience),
    order: typeof parsed.data.order === 'number' ? parsed.data.order : Number(parsed.data.order) || 0,
    summary: asString(parsed.data.summary),
  }

  return {
    ...frontmatter,
    body: parsed.content.trim(),
    headings: extractHeadings(parsed.content),
  }
}
