import type { Knex } from 'knex'
import { db } from '../models/db.js'
import type { SaleItemKind, SalePaymentMethod, SaleStatus } from '../schemas/companySaleSchemas.js'

export type CompanySaleRow = {
  id: string
  company_id: string
  bill_number: string
  customer_user_id: string
  customer_display_name: string
  customer_email: string | null
  status: SaleStatus
  payment_method: SalePaymentMethod
  currency: string
  subtotal: string | number
  total: string | number
  notes: string | null
  created_by_user_id: string
  created_at: Date
  updated_at: Date
}

export type CompanySaleLineRow = {
  id: string
  sale_id: string
  company_id: string
  line_no: number
  item_kind: SaleItemKind
  catalog_item_id: string
  library_entity_id: string | null
  name_snapshot: string
  variant_name_snapshot: string | null
  quantity: string | number
  unit_price: string | number
  line_total: string | number
}

export type CompanySaleCounterRow = {
  company_id: string
  next_seq: number
}

export async function allocateBillNumber(
  trx: Knex.Transaction,
  companyId: string,
): Promise<string> {
  const existing = await trx<CompanySaleCounterRow>('company_sale_counters')
    .where({ company_id: companyId })
    .forUpdate()
    .first()

  let seq: number
  if (!existing) {
    seq = 1
    await trx('company_sale_counters').insert({ company_id: companyId, next_seq: 2 })
  } else {
    seq = existing.next_seq
    await trx('company_sale_counters')
      .where({ company_id: companyId })
      .update({ next_seq: seq + 1 })
  }

  return `BILL-${String(seq).padStart(6, '0')}`
}

export async function insertSale(
  trx: Knex.Transaction,
  row: Omit<CompanySaleRow, 'created_at' | 'updated_at' | 'subtotal' | 'total'> & {
    subtotal: number
    total: number
    created_at: Date
    updated_at: Date
  },
): Promise<void> {
  await trx('company_sales').insert(row)
}

export async function insertSaleLines(
  trx: Knex.Transaction,
  rows: Array<
    Omit<CompanySaleLineRow, 'quantity' | 'unit_price' | 'line_total'> & {
      quantity: number
      unit_price: number
      line_total: number
    }
  >,
): Promise<void> {
  if (rows.length === 0) return
  await trx('company_sale_lines').insert(rows)
}

export async function findSaleById(
  companyId: string,
  id: string,
): Promise<CompanySaleRow | undefined> {
  return db<CompanySaleRow>('company_sales').where({ id, company_id: companyId }).first()
}

export async function listSaleLines(saleId: string): Promise<CompanySaleLineRow[]> {
  return db<CompanySaleLineRow>('company_sale_lines').where({ sale_id: saleId }).orderBy('line_no', 'asc')
}

export async function listSalesForCompany(
  companyId: string,
  options: {
    q?: string
    customerUserId?: string
    itemKind?: SaleItemKind
    status?: SaleStatus
    from?: string
    to?: string
    page: number
    pageSize: number
  },
): Promise<{ rows: CompanySaleRow[]; total: number }> {
  const query = db<CompanySaleRow>('company_sales').where({ company_id: companyId })

  if (options.customerUserId) {
    query.andWhere('customer_user_id', options.customerUserId)
  }
  if (options.status) {
    query.andWhere('status', options.status)
  }
  if (options.from) {
    query.andWhere('created_at', '>=', `${options.from} 00:00:00.000`)
  }
  if (options.to) {
    query.andWhere('created_at', '<=', `${options.to} 23:59:59.999`)
  }
  if (options.q) {
    const pattern = `%${options.q}%`
    query.andWhere(function search() {
      this.where('bill_number', 'like', pattern)
        .orWhere('customer_display_name', 'like', pattern)
        .orWhere('customer_email', 'like', pattern)
    })
  }
  if (options.itemKind) {
    query.whereIn(
      'id',
      db('company_sale_lines').select('sale_id').where({
        company_id: companyId,
        item_kind: options.itemKind,
      }),
    )
  }

  const countRow = await query.clone().count<{ count: string | number }>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query
    .clone()
    .orderBy('created_at', 'desc')
    .offset((options.page - 1) * options.pageSize)
    .limit(options.pageSize)

  return { rows, total }
}

export async function listSalesForCustomer(
  companyId: string,
  customerUserId: string,
  limit = 200,
): Promise<CompanySaleRow[]> {
  return db<CompanySaleRow>('company_sales')
    .where({ company_id: companyId, customer_user_id: customerUserId })
    .orderBy('created_at', 'desc')
    .limit(limit)
}

export async function voidSale(
  companyId: string,
  id: string,
): Promise<CompanySaleRow | undefined> {
  await db('company_sales').where({ id, company_id: companyId }).update({
    status: 'void',
    updated_at: new Date(),
  })
  return findSaleById(companyId, id)
}
