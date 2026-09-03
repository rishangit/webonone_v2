export type ArticleAudience = 'all' | 'owner' | 'staff' | 'member' | 'super_admin'

export interface ArticleFrontmatter {
  title: string
  category: string
  slug: string
  audience: ArticleAudience
  order: number
  summary: string
}

export interface HelpArticle extends ArticleFrontmatter {
  body: string
  headings: string[]
}

export interface HelpCategory {
  id: string
  order: number
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'getting-started', order: 1 },
  { id: 'companies', order: 2 },
  { id: 'app-preferences', order: 3 },
  { id: 'calendar', order: 4 },
  { id: 'people', order: 5 },
  { id: 'catalog', order: 6 },
  { id: 'communications', order: 7 },
  { id: 'sales-billing', order: 8 },
  { id: 'website-forms', order: 9 },
  { id: 'public-catalog', order: 10 },
  { id: 'glossary', order: 11 },
]

export const POPULAR_SLUGS = [
  'getting-started/what-is-webonone',
  'getting-started/create-account',
  'companies/register-company',
  'getting-started/roles',
] as const

export function articlePath(article: Pick<HelpArticle, 'category' | 'slug'>): string {
  return `/docs/${article.category}/${article.slug}`
}

export function articleKey(article: Pick<HelpArticle, 'category' | 'slug'>): string {
  return `${article.category}/${article.slug}`
}
