import { useMemo, useState } from 'react'

import { Link, useSearchParams } from 'react-router-dom'

import { useTranslation } from 'react-i18next'

import { ItemList, ItemListContent, ItemListEmpty, ItemListItem, SearchInput } from '@webonone/ui-kit'

import { SupportPage } from '@/features/docs/components/SupportPage'

import { articlePath } from '@/features/docs/content/types'

import { useHelpCatalog } from '@/features/docs/hooks/useHelpCatalog'



export function SearchPage() {

  const { t } = useTranslation('docs')

  const { t: ts } = useTranslation('shell')

  const { searchArticles } = useHelpCatalog()

  const [params, setParams] = useSearchParams()

  const urlQuery = params.get('q') ?? ''

  const [draft, setDraft] = useState(urlQuery)

  const results = useMemo(() => searchArticles(urlQuery), [urlQuery, searchArticles])



  function applyQuery(next: string) {

    const trimmed = next.trim()

    const nextParams = new URLSearchParams()

    if (trimmed) {

      nextParams.set('q', trimmed)

    }

    setParams(nextParams, { replace: true })

  }



  return (

    <SupportPage className="mx-auto max-w-3xl">

      <div>

        <h1 className="text-2xl font-semibold text-foreground">{t('searchTitle')}</h1>

        {urlQuery ? (

          <p className="mt-1 text-muted-foreground">{t('searchQuery', { query: urlQuery })}</p>

        ) : null}

      </div>

      <SearchInput

        value={draft}

        onChange={(event) => setDraft(event.target.value)}

        onClear={() => {

          setDraft('')

          applyQuery('')

        }}

        onKeyDown={(event) => {

          if (event.key === 'Enter') {

            event.preventDefault()

            applyQuery(draft)

          }

        }}

        placeholder={ts('searchPlaceholder')}

        aria-label={ts('searchAria')}

      />

      {urlQuery && results.length === 0 ? (

        <ItemListEmpty>{t('noResults')}</ItemListEmpty>

      ) : (

        <ItemList>

          {results.map((article) => (

            <ItemListItem key={`${article.category}/${article.slug}`}>

              <ItemListContent>

                <Link to={articlePath(article)} className="block">

                  <p className="font-medium text-foreground">{article.title}</p>

                  <p className="text-sm text-muted-foreground">{article.summary}</p>

                </Link>

              </ItemListContent>

            </ItemListItem>

          ))}

        </ItemList>

      )}

    </SupportPage>

  )

}

