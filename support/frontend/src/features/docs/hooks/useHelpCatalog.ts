import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  articlesInCategory,
  getArticle,
  getHelpArticles,
  searchArticles,
} from '@/features/docs/content/catalog'

export function useHelpCatalog() {
  const { i18n } = useTranslation()
  const locale = i18n.language

  return useMemo(
    () => ({
      articles: getHelpArticles(locale),
      getArticle: (category: string, slug: string) => getArticle(category, slug, locale),
      articlesInCategory: (category: string) => articlesInCategory(category, locale),
      searchArticles: (query: string) => searchArticles(query, locale),
    }),
    [locale],
  )
}
