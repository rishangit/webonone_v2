import { db } from '../models/db.js'

const TOP_N = 8

export type NamedCount = { key: string; label: string; count: number }
export type NamedAmount = { key: string; label: string; amount: number }
export type TimeBucket = { date: string; amount: number }
export type RevenueTimeBucket = { date: string; amount: number; profit: number }

function asNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function asYmd(value: unknown): string {
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof value === 'string') return value.slice(0, 10)
  return String(value ?? '').slice(0, 10)
}

function rangeBounds(from: string, to: string): [string, string] {
  return [`${from} 00:00:00.000`, `${to} 23:59:59.999`]
}

export async function countCatalog(companyId: string): Promise<{
  products: number
  services: number
  spaces: number
}> {
  const [products, services, spaces] = await Promise.all([
    db('company_products').where({ company_id: companyId }).count({ c: '*' }).first(),
    db('company_services').where({ company_id: companyId }).count({ c: '*' }).first(),
    db('company_spaces').where({ company_id: companyId }).count({ c: '*' }).first(),
  ])
  return {
    products: asNumber(products?.c),
    services: asNumber(services?.c),
    spaces: asNumber(spaces?.c),
  }
}

export async function countStaff(companyId: string): Promise<number> {
  const row = await db('company_staff').where({ company_id: companyId }).count({ c: '*' }).first()
  return asNumber(row?.c)
}

export async function saleKpis(
  companyId: string,
  from: string,
  to: string,
): Promise<{ saleCount: number; revenueTotal: number; uniqueCustomers: number }> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const row = await db('company_sales')
    .where({ company_id: companyId, status: 'completed' })
    .whereBetween('created_at', [fromAt, toAt])
    .select(
      db.raw('COUNT(*) as saleCount'),
      db.raw('COALESCE(SUM(total), 0) as revenueTotal'),
      db.raw('COUNT(DISTINCT customer_user_id) as uniqueCustomers'),
    )
    .first()
  return {
    saleCount: asNumber(row?.saleCount),
    revenueTotal: asNumber(row?.revenueTotal),
    uniqueCustomers: asNumber(row?.uniqueCustomers),
  }
}

export type SaleLineCostRow = {
  id: string
  date: string
  lineTotal: number
  quantity: number
  unitCost: number | null
  itemKind: string
  libraryEntityId: string | null
  libraryVariantId: string | null
  libraryStockId: string | null
}

export async function listCompletedSaleLinesInRange(
  companyId: string,
  from: string,
  to: string,
): Promise<SaleLineCostRow[]> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('company_sale_lines as l')
    .join('company_sales as s', 's.id', 'l.sale_id')
    .where({ 's.company_id': companyId, 's.status': 'completed' })
    .whereBetween('s.created_at', [fromAt, toAt])
    .select(
      'l.id as id',
      db.raw('DATE(s.created_at) as bucket'),
      'l.line_total as lineTotal',
      'l.quantity as quantity',
      'l.unit_cost as unitCost',
      'l.item_kind as itemKind',
      'l.library_entity_id as libraryEntityId',
      'l.library_variant_id as libraryVariantId',
      'l.library_stock_id as libraryStockId',
    )
  return rows.map((row) => ({
    id: String(row.id),
    date: asYmd(row.bucket),
    lineTotal: asNumber(row.lineTotal),
    quantity: asNumber(row.quantity),
    unitCost: row.unitCost == null || row.unitCost === '' ? null : asNumber(row.unitCost),
    itemKind: String(row.itemKind),
    libraryEntityId: row.libraryEntityId ? String(row.libraryEntityId) : null,
    libraryVariantId: row.libraryVariantId ? String(row.libraryVariantId) : null,
    libraryStockId: row.libraryStockId ? String(row.libraryStockId) : null,
  }))
}

export async function setSaleLineUnitCost(id: string, unitCost: number): Promise<void> {
  await db('company_sale_lines').where({ id }).whereNull('unit_cost').update({ unit_cost: unitCost })
}

export async function revenueByKind(
  companyId: string,
  from: string,
  to: string,
): Promise<NamedAmount[]> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('company_sale_lines as l')
    .join('company_sales as s', 's.id', 'l.sale_id')
    .where({ 's.company_id': companyId, 's.status': 'completed' })
    .whereBetween('s.created_at', [fromAt, toAt])
    .select('l.item_kind as key', db.raw('COALESCE(SUM(l.line_total), 0) as amount'))
    .groupBy('l.item_kind')
  return rows.map((row) => ({
    key: String(row.key),
    label: String(row.key),
    amount: asNumber(row.amount),
  }))
}

export async function revenueByPaymentMethod(
  companyId: string,
  from: string,
  to: string,
): Promise<NamedAmount[]> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('company_sales')
    .where({ company_id: companyId, status: 'completed' })
    .whereBetween('created_at', [fromAt, toAt])
    .select('payment_method as key', db.raw('COALESCE(SUM(total), 0) as amount'))
    .groupBy('payment_method')
  return rows.map((row) => ({
    key: String(row.key ?? 'other'),
    label: String(row.key ?? 'other'),
    amount: asNumber(row.amount),
  }))
}

export async function topItemsByKind(
  companyId: string,
  from: string,
  to: string,
): Promise<{ product: NamedAmount[]; service: NamedAmount[]; space: NamedAmount[] }> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('company_sale_lines as l')
    .join('company_sales as s', 's.id', 'l.sale_id')
    .where({ 's.company_id': companyId, 's.status': 'completed' })
    .whereBetween('s.created_at', [fromAt, toAt])
    .select(
      'l.item_kind as kind',
      'l.catalog_item_id as key',
      'l.name_snapshot as label',
      db.raw('COALESCE(SUM(l.line_total), 0) as amount'),
    )
    .groupBy('l.item_kind', 'l.catalog_item_id', 'l.name_snapshot')
    .orderBy('amount', 'desc')

  const grouped: Record<'product' | 'service' | 'space', NamedAmount[]> = {
    product: [],
    service: [],
    space: [],
  }
  for (const row of rows) {
    const kind = row.kind as 'product' | 'service' | 'space'
    if (!grouped[kind] || grouped[kind].length >= TOP_N) continue
    grouped[kind].push({
      key: String(row.key),
      label: String(row.label),
      amount: asNumber(row.amount),
    })
  }
  return grouped
}

export async function topCustomers(
  companyId: string,
  from: string,
  to: string,
): Promise<NamedAmount[]> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('company_sales')
    .where({ company_id: companyId, status: 'completed' })
    .whereBetween('created_at', [fromAt, toAt])
    .select(
      'customer_user_id as key',
      'customer_display_name as label',
      db.raw('COALESCE(SUM(total), 0) as amount'),
    )
    .groupBy('customer_user_id', 'customer_display_name')
    .orderBy('amount', 'desc')
    .limit(TOP_N)
  return rows.map((row) => ({
    key: String(row.key),
    label: String(row.label),
    amount: asNumber(row.amount),
  }))
}

export async function salesByStaff(
  companyId: string,
  from: string,
  to: string,
): Promise<NamedAmount[]> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('company_sales as s')
    .leftJoin('company_staff as st', function joinStaff() {
      this.on('st.user_id', '=', 's.created_by_user_id').andOn(
        'st.company_id',
        '=',
        's.company_id',
      )
    })
    .where({ 's.company_id': companyId, 's.status': 'completed' })
    .whereBetween('s.created_at', [fromAt, toAt])
    .select(
      's.created_by_user_id as key',
      db.raw('COALESCE(MAX(st.display_name), s.created_by_user_id) as label'),
      db.raw('COALESCE(SUM(s.total), 0) as amount'),
    )
    .groupBy('s.created_by_user_id')
    .orderBy('amount', 'desc')
    .limit(TOP_N)
  return rows.map((row) => ({
    key: String(row.key),
    label: String(row.label),
    amount: asNumber(row.amount),
  }))
}

export async function eventRunStatusCounts(
  companyId: string,
  from: string,
  to: string,
): Promise<NamedCount[]> {
  const rows = await db('company_event_session_runs')
    .where({ company_id: companyId })
    .whereBetween('occurrence_date', [from, to])
    .select(
      db.raw(
        `CASE WHEN cancelled_at IS NOT NULL THEN 'cancelled' ELSE status END as statusKey`,
      ),
      db.raw('COUNT(*) as count'),
    )
    .groupByRaw(`CASE WHEN cancelled_at IS NOT NULL THEN 'cancelled' ELSE status END`)
  return rows.map((row) => ({
    key: String(row.statusKey),
    label: String(row.statusKey),
    count: asNumber(row.count),
  }))
}

export async function tokenStatusCounts(
  companyId: string,
  from: string,
  to: string,
): Promise<NamedCount[]> {
  const rows = await db('company_event_session_tokens')
    .where({ company_id: companyId })
    .whereBetween('occurrence_date', [from, to])
    .select('status as key', db.raw('COUNT(*) as count'))
    .groupBy('status')
  return rows.map((row) => ({
    key: String(row.key),
    label: String(row.key),
    count: asNumber(row.count),
  }))
}

export async function checkInsByDay(
  companyId: string,
  from: string,
  to: string,
): Promise<TimeBucket[]> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('company_event_session_check_ins')
    .where({ company_id: companyId })
    .whereBetween('checked_in_at', [fromAt, toAt])
    .select(db.raw('DATE(checked_in_at) as bucket'), db.raw('COUNT(*) as amount'))
    .groupByRaw('DATE(checked_in_at)')
    .orderBy('bucket', 'asc')
  return rows.map((row) => ({
    date: asYmd(row.bucket),
    amount: asNumber(row.amount),
  }))
}

export async function countEventsInRange(
  companyId: string,
  from: string,
  to: string,
): Promise<{ occurrenceCount: number; checkInCount: number }> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const [runs, checkIns] = await Promise.all([
    db('company_event_session_runs')
      .where({ company_id: companyId })
      .whereBetween('occurrence_date', [from, to])
      .count({ c: '*' })
      .first(),
    db('company_event_session_check_ins')
      .where({ company_id: companyId })
      .whereBetween('checked_in_at', [fromAt, toAt])
      .count({ c: '*' })
      .first(),
  ])
  return {
    occurrenceCount: asNumber(runs?.c),
    checkInCount: asNumber(checkIns?.c),
  }
}

export async function platformCompanyStatusCounts(): Promise<NamedCount[]> {
  const rows = await db('companies')
    .select('status as key', db.raw('COUNT(*) as count'))
    .groupBy('status')
  return rows.map((row) => ({
    key: String(row.key),
    label: String(row.key),
    count: asNumber(row.count),
  }))
}

export async function platformCompaniesByDay(from: string, to: string): Promise<TimeBucket[]> {
  const [fromAt, toAt] = rangeBounds(from, to)
  const rows = await db('companies')
    .whereBetween('created_at', [fromAt, toAt])
    .select(db.raw('DATE(created_at) as bucket'), db.raw('COUNT(*) as amount'))
    .groupByRaw('DATE(created_at)')
    .orderBy('bucket', 'asc')
  return rows.map((row) => ({
    date: asYmd(row.bucket),
    amount: asNumber(row.amount),
  }))
}

export async function platformTotals(): Promise<{
  companyCount: number
  staffCount: number
}> {
  const [companies, staff] = await Promise.all([
    db('companies').count({ c: '*' }).first(),
    db('company_staff').count({ c: '*' }).first(),
  ])
  return {
    companyCount: asNumber(companies?.c),
    staffCount: asNumber(staff?.c),
  }
}
