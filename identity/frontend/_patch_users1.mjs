import fs from 'fs'
import path from 'path'

const root = 'd:/PROJECTS/2026/identity/frontend/src'

function patch(file, fn) {
  const p = path.join(root, file)
  let s = fs.readFileSync(p, 'utf8')
  const next = fn(s)
  if (next !== s) {
    fs.writeFileSync(p, next)
    console.log('patched', file)
  } else {
    console.log('unchanged', file)
  }
}

// --- AppLayout brand + nav ---
patch('app/AppLayout.tsx', (s) => {
  if (!s.includes("useTranslation('shell')")) {
    s = s.replace(
      "const { t, i18n } = useTranslation('common')",
      "const { t, i18n } = useTranslation('common')\n  const { t: tShell } = useTranslation('shell')",
    )
  }

  if (!s.includes('localizeStandaloneNav')) {
    s = s.replace(
      'function withPeerNavActions(',
      `function localizeStandaloneNav(items: NavConfigItem[], tShell: (key: string) => string): NavConfigItem[] {
  const byPath: Record<string, string> = {
    '/login': 'nav.home',
    '/profile': 'nav.profile',
    '/register': 'nav.userRegister',
    '/reset-password': 'nav.resetPassword',
    '/users': 'nav.users',
  }
  return items.map((item) => {
    if (item.type === 'item' && byPath[item.to]) {
      return { ...item, label: tShell(byPath[item.to]) }
    }
    return item
  })
}

function withPeerNavActions(`,
    )
  }

  s = s.replace(
    `  const nav = useMemo(() => {
    const base = returnUrl
      ? buildCoreNavFromQuery(returnUrl, searchParams.get(CORE_NAV_QUERY_PARAM))
      : buildStandaloneNav({ isSuperAdmin, isCompanyAdmin })
    return returnUrl ? withPeerNavActions(base, handleEmailNavClick, handleSmsNavClick) : base
  }, [handleEmailNavClick, handleSmsNavClick, isCompanyAdmin, isSuperAdmin, returnUrl, searchParams])

  const brand = returnUrl ? 'WebOnOne' : 'Identity'`,
    `  const nav = useMemo(() => {
    const base = returnUrl
      ? buildCoreNavFromQuery(returnUrl, searchParams.get(CORE_NAV_QUERY_PARAM))
      : localizeStandaloneNav(buildStandaloneNav({ isSuperAdmin, isCompanyAdmin }), tShell)
    return returnUrl ? withPeerNavActions(base, handleEmailNavClick, handleSmsNavClick) : base
  }, [handleEmailNavClick, handleSmsNavClick, isCompanyAdmin, isSuperAdmin, returnUrl, searchParams, tShell])

  const brand = returnUrl ? tShell('brandWebOnOne') : tShell('brand')`,
  )

  return s
})

// --- createCompanyUserSchemas ---
patch('features/users/schemas/createCompanyUserSchemas.ts', (s) =>
  s
    .replace("'Enter a valid phone number with country code'", "'errors.phoneInvalid'")
    .replace("'First name is required'", "'errors.firstNameRequired'")
    .replace("'Last name is required'", "'errors.lastNameRequired'")
    .replace("'Enter a valid email'", "'errors.emailInvalid'"),
)

console.log('batch1 done')
