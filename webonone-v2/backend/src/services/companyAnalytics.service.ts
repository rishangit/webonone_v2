import * as companyRepo from '../repositories/company.repository.js'
import * as analyticsRepo from '../repositories/companyAnalytics.repository.js'
import * as dataStockClient from '../clients/dataStockClient.js'

function parseDataEntities(
  value: string | companyRepo.CompanyDataEntity[] | null | undefined,
): companyRepo.CompanyDataEntity[] {
  if (value == null) return []
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed.filter(
    (item): item is companyRepo.CompanyDataEntity => typeof item === 'string',
  )
}

function eachYmd(from: string, to: string): string[] {
  const dates: string[] = []
  const cursor = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  while (cursor <= end) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function fillDaySeries(
  from: string,
  to: string,
  points: analyticsRepo.TimeBucket[],
): analyticsRepo.TimeBucket[] {
  const byDate = new Map(points.map((point) => [point.date, point.amount]))
  return eachYmd(from, to).map((date) => ({ date, amount: byDate.get(date) ?? 0 }))
}

function fillRevenueDaySeries(
  from: string,
  to: string,
  points: analyticsRepo.RevenueTimeBucket[],
): analyticsRepo.RevenueTimeBucket[] {
  const byDate = new Map(points.map((point) => [point.date, point]))
  return eachYmd(from, to).map((date) => ({
    date,
    amount: byDate.get(date)?.amount ?? 0,
    profit: byDate.get(date)?.profit ?? 0,
  }))
}

function money(value: number): number {
  return Math.round(value * 100) / 100
}

async function unitCostForLine(
  line: analyticsRepo.SaleLineCostRow,
  cache: Map<string, number>,
): Promise<number> {
  if (line.unitCost != null) return line.unitCost
  if (line.itemKind !== 'product') return 0
  if (!line.libraryEntityId || !line.libraryVariantId || !line.libraryStockId) return 0
  if (!dataStockClient.hasDataStockConfig()) return 0
  const cacheKey = `${line.libraryEntityId}:${line.libraryVariantId}:${line.libraryStockId}`
  const cached = cache.get(cacheKey)
  if (cached != null) return cached
  try {
    const stock = await dataStockClient.getLibraryStock({
      productId: line.libraryEntityId,
      variantId: line.libraryVariantId,
      stockId: line.libraryStockId,
    })
    const cost = money(stock?.costPrice ?? 0)
    cache.set(cacheKey, cost)
    if (stock) {
      await analyticsRepo.setSaleLineUnitCost(line.id, cost)
    }
    return cost
  } catch {
    cache.set(cacheKey, 0)
    return 0
  }
}

async function revenueOverTimeFromLines(
  from: string,
  to: string,
  lines: analyticsRepo.SaleLineCostRow[],
): Promise<{ series: analyticsRepo.RevenueTimeBucket[]; profitTotal: number }> {
  const cache = new Map<string, number>()
  const byDate = new Map<string, { amount: number; profit: number }>()
  let profitTotal = 0
  for (const line of lines) {
    const unitCost = await unitCostForLine(line, cache)
    const cost = money(line.quantity * unitCost)
    const profit = money(line.lineTotal - cost)
    const current = byDate.get(line.date) ?? { amount: 0, profit: 0 }
    current.amount = money(current.amount + line.lineTotal)
    current.profit = money(current.profit + profit)
    byDate.set(line.date, current)
    profitTotal = money(profitTotal + profit)
  }
  return {
    series: fillRevenueDaySeries(
      from,
      to,
      [...byDate.entries()].map(([date, value]) => ({ date, ...value })),
    ),
    profitTotal,
  }
}

export type CompanyAnalyticsDto = {
  from: string
  to: string
  kpis: {
    saleCount: number
    revenueTotal: number
    profitTotal: number
    uniqueCustomers: number
    staffCount: number
    productCount: number
    serviceCount: number
    spaceCount: number
    occurrenceCount: number
    checkInCount: number
  }
  companyProgress: {
    status: companyRepo.CompanyStatus
    enabledDataEntities: companyRepo.CompanyDataEntity[]
    catalog: { products: number; services: number; spaces: number }
  }
  revenueOverTime: analyticsRepo.RevenueTimeBucket[]
  revenueByKind: analyticsRepo.NamedAmount[]
  revenueByPaymentMethod: analyticsRepo.NamedAmount[]
  topItems: {
    product: analyticsRepo.NamedAmount[]
    service: analyticsRepo.NamedAmount[]
    space: analyticsRepo.NamedAmount[]
  }
  topCustomers: analyticsRepo.NamedAmount[]
  salesByStaff: analyticsRepo.NamedAmount[]
  eventRunStatus: analyticsRepo.NamedCount[]
  tokenStatus: analyticsRepo.NamedCount[]
  checkInsOverTime: analyticsRepo.TimeBucket[]
}

export type PlatformAnalyticsDto = {
  from: string
  to: string
  kpis: {
    companyCount: number
    staffCount: number
  }
  companiesByStatus: analyticsRepo.NamedCount[]
  companiesOverTime: analyticsRepo.TimeBucket[]
}

export const getCompanyAnalytics = async (
  companyId: string,
  from: string,
  to: string,
): Promise<CompanyAnalyticsDto> => {
  const company = await companyRepo.findCompanyById(companyId)
  if (!company) {
    const err = new Error('Company not found') as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }

  const [
    kpis,
    catalog,
    staffCount,
    eventCounts,
    saleLines,
    revenueByKind,
    revenueByPaymentMethod,
    topItems,
    topCustomers,
    salesByStaff,
    eventRunStatus,
    tokenStatus,
    checkInsOverTime,
  ] = await Promise.all([
    analyticsRepo.saleKpis(companyId, from, to),
    analyticsRepo.countCatalog(companyId),
    analyticsRepo.countStaff(companyId),
    analyticsRepo.countEventsInRange(companyId, from, to),
    analyticsRepo.listCompletedSaleLinesInRange(companyId, from, to),
    analyticsRepo.revenueByKind(companyId, from, to),
    analyticsRepo.revenueByPaymentMethod(companyId, from, to),
    analyticsRepo.topItemsByKind(companyId, from, to),
    analyticsRepo.topCustomers(companyId, from, to),
    analyticsRepo.salesByStaff(companyId, from, to),
    analyticsRepo.eventRunStatusCounts(companyId, from, to),
    analyticsRepo.tokenStatusCounts(companyId, from, to),
    analyticsRepo.checkInsByDay(companyId, from, to),
  ])

  const { series: revenueOverTime, profitTotal } = await revenueOverTimeFromLines(
    from,
    to,
    saleLines,
  )

  return {
    from,
    to,
    kpis: {
      saleCount: kpis.saleCount,
      revenueTotal: kpis.revenueTotal,
      profitTotal,
      uniqueCustomers: kpis.uniqueCustomers,
      staffCount,
      productCount: catalog.products,
      serviceCount: catalog.services,
      spaceCount: catalog.spaces,
      occurrenceCount: eventCounts.occurrenceCount,
      checkInCount: eventCounts.checkInCount,
    },
    companyProgress: {
      status: company.status,
      enabledDataEntities: parseDataEntities(company.data_entities),
      catalog,
    },
    revenueOverTime,
    revenueByKind,
    revenueByPaymentMethod,
    topItems,
    topCustomers,
    salesByStaff,
    eventRunStatus,
    tokenStatus,
    checkInsOverTime: fillDaySeries(from, to, checkInsOverTime),
  }
}

export const getPlatformAnalytics = async (
  from: string,
  to: string,
): Promise<PlatformAnalyticsDto> => {
  const [totals, companiesByStatus, companiesOverTime] = await Promise.all([
    analyticsRepo.platformTotals(),
    analyticsRepo.platformCompanyStatusCounts(),
    analyticsRepo.platformCompaniesByDay(from, to),
  ])
  return {
    from,
    to,
    kpis: {
      companyCount: totals.companyCount,
      staffCount: totals.staffCount,
    },
    companiesByStatus,
    companiesOverTime: fillDaySeries(from, to, companiesOverTime),
  }
}
