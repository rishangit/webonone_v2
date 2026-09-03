import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  Globe,
  Layout,
  Layers,
  Mail,
  Package,
  Receipt,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@webonone/ui-kit'
import { articlePath, HELP_CATEGORIES } from '@/features/docs/content/types'
import { useHelpCatalog } from '@/features/docs/hooks/useHelpCatalog'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'getting-started': Sparkles,
  companies: Building2,
  'app-preferences': Settings,
  calendar: Calendar,
  people: Users,
  catalog: Package,
  communications: Mail,
  'sales-billing': Receipt,
  'website-forms': Layout,
  'public-catalog': Globe,
  glossary: BookOpen,
}

const navItemClassName =
  'flex items-center gap-3 ui-shape-control px-3 py-3 text-sm font-medium text-label transition-colors md:py-2 hover:bg-[var(--color-selection)] hover:text-primary'

const navItemActiveClassName =
  'border-l-2 border-primary bg-[var(--color-selection)] text-primary'

function categoryIcon(categoryId: string): LucideIcon {
  return CATEGORY_ICONS[categoryId] ?? Layers
}

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation('docs')
  const { t: ts } = useTranslation('shell')
  const { articles: helpArticles } = useHelpCatalog()
  const location = useLocation()
  const activePath = location.pathname

  const categoriesWithArticles = useMemo(
    () =>
      HELP_CATEGORIES.map((category) => ({
        ...category,
        articles: helpArticles.filter((article) => article.category === category.id),
      })).filter((category) => category.articles.length > 0),
    [helpArticles],
  )

  const activeCategoryId = useMemo(() => {
    const match = categoriesWithArticles.find((category) =>
      category.articles.some((article) => articlePath(article) === activePath),
    )
    return match?.id ?? categoriesWithArticles[0]?.id ?? null
  }, [activePath, categoriesWithArticles])

  const [openCategoryId, setOpenCategoryId] = useState<string | null>(activeCategoryId)

  useEffect(() => {
    if (activeCategoryId) {
      setOpenCategoryId(activeCategoryId)
    }
  }, [activeCategoryId])

  return (
    <nav
      aria-label={ts('docsNav')}
      className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 scrollbar-themed"
    >
      {categoriesWithArticles.map((category) => {
        const Icon = categoryIcon(category.id)
        const isOpen = openCategoryId === category.id
        const groupActive = category.articles.some((article) => articlePath(article) === activePath)

        return (
          <div key={category.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenCategoryId((current) => (current === category.id ? null : category.id))}
              className={cn(navItemClassName, 'w-full', groupActive && navItemActiveClassName)}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="flex-1 truncate text-left">{t(category.id)}</span>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <div className="mt-1 space-y-1">
                {category.articles.map((article) => (
                  <NavLink
                    key={`${article.category}/${article.slug}`}
                    to={articlePath(article)}
                    onClick={onNavigate}
                    aria-current={articlePath(article) === activePath ? 'page' : undefined}
                    className={({ isActive }) =>
                      cn(
                        navItemClassName,
                        'ml-6',
                        isActive && navItemActiveClassName,
                      )
                    }
                  >
                    <FileText className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="truncate">{article.title}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
