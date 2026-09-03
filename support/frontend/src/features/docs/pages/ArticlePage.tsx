import { Link, useParams } from 'react-router-dom'

import { useTranslation } from 'react-i18next'

import { normalizeLocale } from '@webonone/i18n'

import { Alert, AlertDescription, Button } from '@webonone/ui-kit'

import { ArticleBody } from '@/features/docs/components/ArticleBody'

import { AudienceBadge } from '@/features/docs/components/AudienceBadge'

import { SupportPage } from '@/features/docs/components/SupportPage'

import { hasLocalizedArticle } from '@/features/docs/content/catalog'

import { articlePath } from '@/features/docs/content/types'

import { useHelpCatalog } from '@/features/docs/hooks/useHelpCatalog'



export function ArticlePage() {

  const { category = '', slug = '' } = useParams()

  const { t, i18n } = useTranslation('docs')

  const { getArticle, articlesInCategory } = useHelpCatalog()

  const article = getArticle(category, slug)

  const isEnglishFallback =

    normalizeLocale(i18n.language) === 'si' && !hasLocalizedArticle(category, slug, i18n.language)



  if (!article) {

    return (

      <SupportPage className="mx-auto max-w-3xl">

        <Alert>

          <AlertDescription>

            <p className="font-medium text-foreground">{t('notFound')}</p>

            <p className="mt-1">{t('notFoundBody')}</p>

          </AlertDescription>

        </Alert>

        <Button type="button" variant="outline" asChild>

          <Link to="/">{t('backHome')}</Link>

        </Button>

      </SupportPage>

    )

  }



  const related = articlesInCategory(article.category).filter(

    (item) => item.slug !== article.slug,

  )



  return (

    <SupportPage className="mx-auto max-w-3xl">

      <article className="flex flex-col gap-3">

        <div>

          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">

            {t(article.category)}

          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">

            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{article.title}</h1>

            <AudienceBadge audience={article.audience} />

          </div>

          {article.summary ? (

            <p className="mt-2 text-muted-foreground">{article.summary}</p>

          ) : null}

          {isEnglishFallback ? (

            <p className="mt-3 text-sm text-muted-foreground">{t('englishFallback')}</p>

          ) : null}

        </div>

        <ArticleBody markdown={article.body} />

        {related.length > 0 ? (

          <section className="border-t border-border pt-6">

            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">

              {t('related')}

            </h2>

            <ul className="mt-3 space-y-2">

              {related.map((item) => (

                <li key={item.slug}>

                  <Link to={articlePath(item)} className="text-sm text-primary hover:underline">

                    {item.title}

                  </Link>

                </li>

              ))}

            </ul>

          </section>

        ) : null}

      </article>

    </SupportPage>

  )

}

