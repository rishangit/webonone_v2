export type CatalogWizardAttributeRow = {
  attributeId: string
  valueText: string
  valueNumber: string
}

/** Map wizard attribute rows to API payload entries (skip incomplete / invalid rows). */
type CatalogAttributePayloadRow = {
  attributeId: string
  valueText?: string | null
  valueNumber?: number | null
}

export function catalogWizardAttributesToPayload(
  rows: CatalogWizardAttributeRow[],
  attributeOptions: Array<{ id: string; valueType: string }>,
): CatalogAttributePayloadRow[] {
  const mapped: CatalogAttributePayloadRow[] = []

  for (const row of rows) {
    if (!row.attributeId.trim()) continue
    const attr = attributeOptions.find((a) => a.id === row.attributeId)
    if (attr?.valueType === 'number') {
      const trimmed = row.valueNumber.trim()
      if (trimmed === '') continue
      const n = Number(trimmed)
      if (!Number.isFinite(n)) continue
      mapped.push({ attributeId: row.attributeId, valueNumber: n })
      continue
    }
    const text = row.valueText.trim()
    if (!text) continue
    mapped.push({ attributeId: row.attributeId, valueText: text })
  }

  return mapped
}
