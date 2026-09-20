export const MY_COMPANIES_PATH = '/settings/companies'
export const CONNECTED_COMPANIES_PATH = '/settings/connected-companies'
export const ALL_COMPANIES_PATH = '/companies'

export function companySettingsProfilePath(listPath: string, companyId: string): string {
  return `${listPath}/${companyId}`
}
