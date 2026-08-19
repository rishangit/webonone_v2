export const MY_COMPANIES_PATH = '/settings/companies'
export const CONNECTED_COMPANIES_PATH = '/settings/connected-companies'

export function isConnectedCompaniesPath(pathname: string): boolean {
  return (
    pathname === CONNECTED_COMPANIES_PATH || pathname.startsWith(`${CONNECTED_COMPANIES_PATH}/`)
  )
}

export function companySettingsListPath(pathname: string): string {
  return isConnectedCompaniesPath(pathname) ? CONNECTED_COMPANIES_PATH : MY_COMPANIES_PATH
}

export function companySettingsProfilePath(listPath: string, companyId: string): string {
  return `${listPath}/${companyId}`
}

export function companySettingsCatalogItemPath(
  listPath: string,
  companyId: string,
  kind: string,
  itemId: string,
): string {
  return `${listPath}/${companyId}/catalog/${kind}/${itemId}`
}
