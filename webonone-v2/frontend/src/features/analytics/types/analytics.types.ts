export type NamedCount = {
  key: string
  label: string
  count: number
}

export type NamedAmount = {
  key: string
  label: string
  amount: number
}

export type TimeBucket = {
  date: string
  amount: number
  profit?: number
}

export type CompanyAnalytics = {
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
    status: 'pending' | 'approved' | 'rejected'
    enabledDataEntities: string[]
    catalog: { products: number; services: number; spaces: number }
  }
  revenueOverTime: TimeBucket[]
  revenueByKind: NamedAmount[]
  revenueByPaymentMethod: NamedAmount[]
  topItems: {
    product: NamedAmount[]
    service: NamedAmount[]
    space: NamedAmount[]
  }
  topCustomers: NamedAmount[]
  salesByStaff: NamedAmount[]
  eventRunStatus: NamedCount[]
  tokenStatus: NamedCount[]
  checkInsOverTime: TimeBucket[]
}

export type PlatformAnalytics = {
  from: string
  to: string
  kpis: {
    companyCount: number
    staffCount: number
  }
  companiesByStatus: NamedCount[]
  companiesOverTime: TimeBucket[]
}

export type AnalyticsRangeKey = '7d' | '30d' | '90d' | 'year'
