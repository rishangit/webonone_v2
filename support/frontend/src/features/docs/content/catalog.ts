import { normalizeLocale } from '@webonone/i18n'
import { parseArticle } from './parseArticle'
import { HELP_CATEGORIES, articleKey, type HelpArticle } from './types'

type ContentLocale = 'en' | 'si'

const enModules = import.meta.glob('../../../content/en/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const siModules = import.meta.glob('../../../content/si/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function toContentLocale(locale: string): ContentLocale {
  return normalizeLocale(locale) === 'si' ? 'si' : 'en'
}

function loadLocaleMap(modules: Record<string, string>): Map<string, HelpArticle> {
  const map = new Map<string, HelpArticle>()
  for (const raw of Object.values(modules)) {
    const article = parseArticle(raw)
    if (article) {
      map.set(articleKey(article), article)
    }
  }
  return map
}

const enArticles = loadLocaleMap(enModules)
const siArticles = loadLocaleMap(siModules)

function sortArticles(articles: HelpArticle[]): HelpArticle[] {
  return [...articles].sort((a, b) => {
    const catA = HELP_CATEGORIES.find((c) => c.id === a.category)?.order ?? 99
    const catB = HELP_CATEGORIES.find((c) => c.id === b.category)?.order ?? 99
    if (catA !== catB) return catA - catB
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title)
  })
}

function resolveArticle(key: string, locale: ContentLocale): HelpArticle | undefined {
  if (locale === 'si') {
    return siArticles.get(key) ?? enArticles.get(key)
  }
  return enArticles.get(key)
}

export function getHelpArticles(locale: string): HelpArticle[] {
  const contentLocale = toContentLocale(locale)
  const keys = new Set([...enArticles.keys(), ...siArticles.keys()])
  const articles: HelpArticle[] = []
  for (const key of keys) {
    const article = resolveArticle(key, contentLocale)
    if (article) {
      articles.push(article)
    }
  }
  return sortArticles(articles)
}

export function getArticle(
  category: string,
  slug: string,
  locale: string,
): HelpArticle | undefined {
  return resolveArticle(`${category}/${slug}`, toContentLocale(locale))
}

export function articlesInCategory(category: string, locale: string): HelpArticle[] {
  return getHelpArticles(locale).filter((article) => article.category === category)
}

export function searchArticles(query: string, locale: string): HelpArticle[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) {
    return []
  }
  return getHelpArticles(locale).filter((article) => {
    const haystack = [article.title, article.summary, ...article.headings, article.body]
      .join('\n')
      .toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}

export function hasLocalizedArticle(category: string, slug: string, locale: string): boolean {
  const key = `${category}/${slug}`
  return toContentLocale(locale) === 'si' ? siArticles.has(key) : enArticles.has(key)
}
