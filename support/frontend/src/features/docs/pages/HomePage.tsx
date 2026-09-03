import { Link } from 'react-router-dom'

import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@webonone/ui-kit'

import { SupportPage } from '@/features/docs/components/SupportPage'

import { articlePath, HELP_CATEGORIES, POPULAR_SLUGS } from '@/features/docs/content/types'

import { useHelpCatalog } from '@/features/docs/hooks/useHelpCatalog'



export function HomePage() {

  const { t } = useTranslation('home')

  const { t: td } = useTranslation('docs')

  const { articles: helpArticles } = useHelpCatalog()

  const popular = POPULAR_SLUGS.map((key) =>

    helpArticles.find((article) => `${article.category}/${article.slug}` === key),

  ).filter((article) => article != null)



  return (

    <SupportPage className="mx-auto max-w-5xl gap-8">

      <div>

        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{t('title')}</h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">{t('subtitle')}</p>

      </div>



      {popular.length > 0 ? (

        <section>

          <h2 className="mb-4 text-lg font-medium text-foreground">{t('popular')}</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {popular.map((article) => (

              <Link key={`${article.category}/${article.slug}`} to={articlePath(article)}>

                <Card className="h-full transition-colors hover:border-primary">

                  <CardHeader>

                    <CardTitle className="text-base">{article.title}</CardTitle>

                    <CardDescription>{article.summary}</CardDescription>

                  </CardHeader>

                </Card>

              </Link>

            ))}

          </div>

        </section>

      ) : null}



      <section>

        <h2 className="mb-4 text-lg font-medium text-foreground">{t('browse')}</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {HELP_CATEGORIES.map((category) => {

            const articles = helpArticles.filter((article) => article.category === category.id)

            if (articles.length === 0) return null

            return (

              <Card key={category.id}>

                <CardHeader>

                  <CardTitle className="text-base">{td(category.id)}</CardTitle>

                  <CardDescription>{t('articleCount', { count: articles.length })}</CardDescription>

                </CardHeader>

                <CardContent>

                  <ul className="space-y-1">

                    {articles.slice(0, 4).map((article) => (

                      <li key={article.slug}>

                        <Link

                          to={articlePath(article)}

                          className="text-sm text-primary hover:underline"

                        >

                          {article.title}

                        </Link>

                      </li>

                    ))}

                  </ul>

                </CardContent>

              </Card>

            )

          })}

        </div>

      </section>

    </SupportPage>

  )

}

