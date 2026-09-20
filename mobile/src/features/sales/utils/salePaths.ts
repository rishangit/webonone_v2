export const SALES_HISTORY_PATH = '/sales'
export const SALES_POS_PATH = '/sales/pos'

export function saleDetailPath(saleId: string): string {
  return `/sales/${saleId}`
}
