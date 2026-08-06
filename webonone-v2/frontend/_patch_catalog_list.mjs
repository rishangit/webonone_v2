import fs from 'fs'

const p = 'src/features/company-catalog/pages/CompanyCatalogListPage.tsx'
let c = fs.readFileSync(p, 'utf8')
if (c.includes("useTranslation('catalog')")) {
  console.log('already patched')
  process.exit(0)
}

c = c.replace(
  "import { useNavigate } from 'react-router-dom'",
  "import { useNavigate } from 'react-router-dom'\nimport { useTranslation } from 'react-i18next'",
)

c = c.replace(
  'export function CompanyCatalogListPage({ kind }: CompanyCatalogListPageProps) {\n  const dispatch = useAppDispatch()',
  "export function CompanyCatalogListPage({ kind }: CompanyCatalogListPageProps) {\n  const { t } = useTranslation('catalog')\n  const dispatch = useAppDispatch()",
)

c = c.replace(
  '  const loading = listStatus === \'loading\' && storeKind === kind\n  usePlatformLoading(loading ? `Loading ${CATALOG_ENTITY_LABELS[kind].toLowerCase()}…` : null)',
  `  const entityLabel = CATALOG_ENTITY_LABELS[kind]
  const entityLower = entityLabel.toLowerCase()
  const loading = listStatus === 'loading' && storeKind === kind
  usePlatformLoading(loading ? t('loadingEntity', { entity: entityLower }) : null)`,
)

c = c.replace('title={CATALOG_ENTITY_LABELS[kind]}', 'title={entityLabel}')

c = c.replace(
  /description=\{`Company \$\{CATALOG_ENTITY_LABELS\[kind\]\.toLowerCase\(\)\}[^`]*`\}/,
  "description={t('companyEntityDescription', { entity: entityLower })}",
)

c = c.replace(
  /placeholder=\{`Search \$\{CATALOG_ENTITY_LABELS\[kind\]\.toLowerCase\(\)\}`\}/,
  "placeholder={t('searchEntity', { entity: entityLower })}",
)

c = c.replace(
  /aria-label=\{`Search \$\{CATALOG_ENTITY_LABELS\[kind\]\.toLowerCase\(\)\}`\}/,
  "aria-label={t('searchEntity', { entity: entityLower })}",
)

c = c.replace('Add {noun}', "{t('addEntity', { entity: noun })}")

c = c.replace(
  /\{search\.trim\(\)\s*\?\s*`No \$\{CATALOG_ENTITY_LABELS\[kind\]\.toLowerCase\(\)\} match your search\.`\s*:\s*`No company \$\{CATALOG_ENTITY_LABELS\[kind\]\.toLowerCase\(\)\} yet\.`\}/,
  "{search.trim()\n                ? t('noEntityMatch', { entity: entityLower })\n                : t('noCompanyEntity', { entity: entityLower })}",
)

c = c.replace(
  '<StatusTag variant="pending">Library unavailable</StatusTag>',
  '<StatusTag variant="pending">{t(\'libraryUnavailable\')}</StatusTag>',
)

c = c.replace(
  /<DropdownMenuItem onClick=\{\(\) => navigate\(`\/data\/\$\{kind\}\/\$\{item\.id\}`\)\}>\s*View details\s*<\/DropdownMenuItem>/,
  "<DropdownMenuItem onClick={() => navigate(`/data/${kind}/${item.id}`)}>\n                    {t('common:details')}\n                  </DropdownMenuItem>",
)

c = c.replace(
  />\s*Remove\s*<\/DropdownMenuItem>/,
  ">{t('common:remove')}</DropdownMenuItem>",
)

c = c.replace(
  /title=\{pendingRemove \? `Remove \$\{pendingRemove\.name\}\?` : `Remove \$\{noun\}\?`\}/,
  "title={pendingRemove ? t('removeNamed', { name: pendingRemove.name }) : t('removeEntity', { entity: noun })}",
)

c = c.replace(
  'description="This action cannot be undone. The item will be removed from your company catalog."',
  "description={t('removeItemConfirm')}",
)

c = c.replace('submitLabel="Remove"', "submitLabel={t('common:remove')}")

fs.writeFileSync(p, c)
console.log('patched ok')
